"use client";

import { useEffect, useState } from "react";
import { Room } from "livekit-client";
import {
  getPreferredAudioDevice,
  getPreferredOutputDevice,
  getPreferredVideoDevice,
} from "@/lib/media/devicePrefs";

const outputSelectionSupported =
  typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

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

  useEffect(() => {
    Room.getLocalDevices("audioinput").then(setMics).catch(() => {});
    Room.getLocalDevices("videoinput").then(setCameras).catch(() => {});
    if (outputSelectionSupported) {
      Room.getLocalDevices("audiooutput").then(setSpeakers).catch(() => {});
    }
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
          <select
            value={selectedMic}
            onChange={(e) => {
              setSelectedMic(e.target.value);
              handleSwitch("audioinput", e.target.value);
            }}
            className="w-full rounded-sm border border-line bg-console px-2 py-1.5 text-xs text-paper focus-visible:outline-teal"
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
          {outputSelectionSupported ? (
            <select
              value={selectedSpeaker}
              onChange={(e) => {
                setSelectedSpeaker(e.target.value);
                handleSwitch("audiooutput", e.target.value);
              }}
              className="w-full rounded-sm border border-line bg-console px-2 py-1.5 text-xs text-paper focus-visible:outline-teal"
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
            <p className="rounded-sm border border-line bg-console px-2 py-1.5 text-[11px] text-dust-dim">
              Ce navigateur ne permet pas de choisir la sortie audio — le son suit le
              haut-parleur par défaut du système.
            </p>
          )}
        </label>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
