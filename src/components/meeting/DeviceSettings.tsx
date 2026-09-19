"use client";

import { useEffect, useRef, useState } from "react";
import { Room } from "livekit-client";
import {
  getPreferredAudioDevice,
  getPreferredOutputDevice,
  getPreferredVideoDevice,
} from "@/lib/media/devicePrefs";
import { LiveLevelMeter } from "@/components/meeting/LiveLevelMeter";

const outputSelectionSupported =
  typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

interface MicTestHandle {
  stream: MediaStream;
  ctx: AudioContext;
  analyser: AnalyserNode;
  data: Uint8Array<ArrayBuffer>;
}

export function DeviceSettings({
  onSwitchDevice,
}: {
  onSwitchDevice: (
    kind: "audioinput" | "videoinput" | "audiooutput",
    deviceId: string
  ) => Promise<void>;
}) {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState(getPreferredAudioDevice() ?? "");
  const [selectedCamera, setSelectedCamera] = useState(getPreferredVideoDevice() ?? "");
  const [selectedSpeaker, setSelectedSpeaker] = useState(getPreferredOutputDevice() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [micTesting, setMicTesting] = useState(false);
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const micTestRef = useRef<MicTestHandle | null>(null);

  useEffect(() => {
    Room.getLocalDevices("audioinput").then(setMics).catch(() => {});
    Room.getLocalDevices("videoinput").then(setCameras).catch(() => {});
    if (outputSelectionSupported) {
      Room.getLocalDevices("audiooutput").then(setSpeakers).catch(() => {});
    }
    return () => stopMicTest();
  }, []);

  async function handleSwitch(
    kind: "audioinput" | "videoinput" | "audiooutput",
    deviceId: string
  ) {
    setError(null);
    try {
      await onSwitchDevice(kind, deviceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }

  function stopMicTest() {
    const handle = micTestRef.current;
    if (handle) {
      handle.stream.getTracks().forEach((t) => t.stop());
      void handle.ctx.close();
      micTestRef.current = null;
    }
    setMicTesting(false);
  }

  async function toggleMicTest() {
    if (micTesting) {
      stopMicTest();
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      micTestRef.current = {
        stream,
        ctx,
        analyser,
        data: new Uint8Array(analyser.frequencyBinCount),
      };
      setMicTesting(true);
    } catch {
      setError("Impossible d'accéder à ce microphone pour le tester.");
    }
  }

  function getMicTestLevel() {
    const handle = micTestRef.current;
    if (!handle) return 0;
    handle.analyser.getByteTimeDomainData(handle.data);
    let sumSquares = 0;
    for (const value of handle.data) {
      const normalized = (value - 128) / 128;
      sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / handle.data.length);
  }

  async function testSpeaker() {
    setError(null);
    setSpeakerTesting(true);
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.frequency.value = 440;
      const gain = ctx.createGain();
      gain.gain.value = 0.15;
      osc.connect(gain);
      const destination = ctx.createMediaStreamDestination();
      gain.connect(destination);

      const el = document.createElement("audio");
      el.autoplay = true;
      el.srcObject = destination.stream;
      if (selectedSpeaker && outputSelectionSupported) {
        await el.setSinkId(selectedSpeaker).catch(() => {});
      }
      document.body.appendChild(el);

      osc.start();
      setTimeout(() => {
        osc.stop();
        el.remove();
        void ctx.close();
        setSpeakerTesting(false);
      }, 800);
    } catch {
      setError("Impossible de jouer un son de test.");
      setSpeakerTesting(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-paper">
          Microphone, caméra et sortie
        </h2>
        <p className="mt-0.5 font-mono text-[10px] text-dust-dim">
          Choix mémorisé pour vos prochaines réunions sur cet appareil
        </p>
      </div>
      <div className="space-y-3 px-4 py-3">
        <label className="block">
          <span className="mb-1 block text-[11px] text-dust">Microphone</span>
          <div className="flex gap-1.5">
            <select
              value={selectedMic}
              onChange={(e) => {
                setSelectedMic(e.target.value);
                handleSwitch("audioinput", e.target.value);
              }}
              className="w-full min-w-0 flex-1 rounded-sm border border-line bg-console px-2 py-1.5 text-xs text-paper focus-visible:outline-teal"
            >
              <option value="" disabled>
                Choisir un microphone…
              </option>
              {mics.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || "Microphone"}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleMicTest}
              className={`shrink-0 rounded-sm border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                micTesting
                  ? "border-teal/40 bg-teal/10 text-paper"
                  : "border-line bg-console text-dust hover:text-paper"
              }`}
            >
              {micTesting ? "Arrêter" : "Tester"}
            </button>
          </div>
          {micTesting && (
            <div className="mt-1.5 flex items-center gap-2">
              <LiveLevelMeter getLevel={getMicTestLevel} />
              <span className="font-mono text-[10px] text-dust-dim">Parlez pour tester…</span>
            </div>
          )}
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-dust">Caméra</span>
          <select
            value={selectedCamera}
            onChange={(e) => {
              setSelectedCamera(e.target.value);
              handleSwitch("videoinput", e.target.value);
            }}
            className="w-full rounded-sm border border-line bg-console px-2 py-1.5 text-xs text-paper focus-visible:outline-teal"
          >
            <option value="" disabled>
              Choisir une caméra…
            </option>
            {cameras.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Caméra"}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-dust">Sortie audio (haut-parleur)</span>
          <div className="flex gap-1.5">
            {outputSelectionSupported ? (
              <select
                value={selectedSpeaker}
                onChange={(e) => {
                  setSelectedSpeaker(e.target.value);
                  handleSwitch("audiooutput", e.target.value);
                }}
                className="w-full min-w-0 flex-1 rounded-sm border border-line bg-console px-2 py-1.5 text-xs text-paper focus-visible:outline-teal"
              >
                <option value="" disabled>
                  Choisir une sortie…
                </option>
                {speakers.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || "Haut-parleur"}
                  </option>
                ))}
              </select>
            ) : (
              <p className="flex-1 rounded-sm border border-line bg-console px-2 py-1.5 text-[11px] text-dust-dim">
                Choix non supporté par ce navigateur — sortie par défaut du système.
              </p>
            )}
            <button
              type="button"
              onClick={testSpeaker}
              disabled={speakerTesting}
              className="shrink-0 rounded-sm border border-line bg-console px-2 py-1.5 text-[11px] font-medium text-dust transition-colors hover:text-paper disabled:opacity-60"
            >
              {speakerTesting ? "🔊…" : "Tester"}
            </button>
          </div>
        </label>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
