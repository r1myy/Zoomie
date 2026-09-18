"use client";

import { useState } from "react";
import { Fader } from "@/components/mixer/Fader";

export function MasterVolumeSection({
  percent,
  onChange,
}: {
  percent: number;
  onChange: (percent: number) => void;
}) {
  const [muted, setMuted] = useState(false);
  const [beforeMute, setBeforeMute] = useState(100);

  return (
    <div className="border-b border-line px-4 py-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-dust-dim">
        Volume général (tout le monde)
      </p>
      <Fader
        label="tout le monde"
        percent={percent}
        muted={muted}
        onChange={onChange}
        onToggleMute={() => {
          if (muted) {
            setMuted(false);
            onChange(beforeMute);
          } else {
            setBeforeMute(percent);
            setMuted(true);
            onChange(0);
          }
        }}
      />
    </div>
  );
}
