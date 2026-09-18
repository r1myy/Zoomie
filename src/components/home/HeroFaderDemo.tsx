"use client";

import { useEffect, useRef, useState } from "react";
import { Fader } from "@/components/mixer/Fader";
import { LevelMeter } from "@/components/mixer/LevelMeter";

const VOICES = [
  { name: "Sophie", base: 0.55, speed: 1.7 },
  { name: "Marc-André", base: 0.4, speed: 1.1 },
];

export function HeroFaderDemo() {
  const [percent, setPercent] = useState(70);
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [otherLevel, setOtherLevel] = useState(0);
  const t = useRef(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      t.current += 0.05;
      const gain = muted ? 0 : percent / 100;
      const noise = (n: number) => Math.max(0, Math.sin(n) * 0.5 + Math.sin(n * 2.3) * 0.3 + 0.3);
      setLevel(Math.min(1, noise(t.current * VOICES[0].speed) * VOICES[0].base * gain));
      setOtherLevel(Math.min(1, noise(t.current * VOICES[1].speed + 2) * VOICES[1].base));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percent, muted]);

  return (
    <div className="w-full max-w-sm rounded-md border border-line bg-panel p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-dust-dim">
        Ce que vous entendez — vous seul
      </p>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-paper">{VOICES[0].name}</span>
          <LevelMeter level={level} />
        </div>
        <Fader
          label={VOICES[0].name}
          percent={percent}
          muted={muted}
          onChange={setPercent}
          onToggleMute={() => setMuted((m) => !m)}
        />
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-dust">{VOICES[1].name}</span>
          <LevelMeter level={otherLevel} />
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-dust-dim">
        Baissez {VOICES[0].name} pour vous : {VOICES[1].name} ne s&apos;en aperçoit pas, et
        continue de l&apos;entendre normalement.
      </p>
    </div>
  );
}
