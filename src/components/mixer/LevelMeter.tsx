"use client";

const SEGMENTS = 12;
// Classic meter convention: safe -> driving -> peak.
const SEGMENT_COLOR = (index: number) => {
  const ratio = index / SEGMENTS;
  if (ratio > 0.85) return "var(--danger)";
  if (ratio > 0.6) return "var(--amber)";
  return "var(--teal)";
};

export function LevelMeter({ level }: { level: number }) {
  const active = Math.round(Math.min(1, Math.max(0, level)) * SEGMENTS);

  return (
    <div className="flex items-center gap-[2px]" aria-hidden>
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className="h-[9px] w-[3px] rounded-[1px] transition-opacity duration-75"
          style={{
            background: SEGMENT_COLOR(i),
            opacity: i < active ? 1 : 0.14,
          }}
        />
      ))}
    </div>
  );
}
