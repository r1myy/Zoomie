"use client";

import { useEffect, useState } from "react";
import { Room } from "livekit-client";
import { getPreferredAudioDevice, getPreferredVideoDevice } from "@/lib/media/devicePrefs";

export function DeviceSettings({
  onSwitchDevice,
}: {
  onSwitchDevice: (kind: "audioinput" | "videoinput", deviceId: string) => void;
}) {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState(getPreferredAudioDevice() ?? "");
  const [selectedCamera, setSelectedCamera] = useState(getPreferredVideoDevice() ?? "");

  useEffect(() => {
    Room.getLocalDevices("audioinput").then(setMics).catch(() => {});
    Room.getLocalDevices("videoinput").then(setCameras).catch(() => {});
  }, []);

  return (
    <div className="flex h-full flex-col border-l border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-paper">
          Microphone et caméra
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
              onSwitchDevice("audioinput", e.target.value);
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
              onSwitchDevice("videoinput", e.target.value);
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
      </div>
    </div>
  );
}
