"use client";

import styles from "./fader.module.css";

const MAX_PERCENT = 150;

function formatDb(percent: number) {
  if (percent <= 0) return "-∞";
  const db = 20 * Math.log10(percent / 100);
  return `${db >= 0 ? "+" : ""}${db.toFixed(1)}`;
}

export function Fader({
  label,
  percent,
  muted,
  onChange,
  onToggleMute,
}: {
  label: string;
  percent: number;
  muted: boolean;
  onChange: (percent: number) => void;
  onToggleMute: () => void;
}) {
  const fillPercent = Math.min(100, (percent / MAX_PERCENT) * 100);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muted ? `Réactiver le son de ${label}` : `Couper le son de ${label} pour vous`}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold transition-colors ${
          muted
            ? "bg-danger text-console"
            : "bg-panel-raised text-dust hover:text-paper"
        }`}
      >
        M
      </button>
      <div className={styles.track} style={{ flex: 1 }}>
        <div
          className={styles.fill}
          style={{ "--fill": `${muted ? 0 : fillPercent}%` } as React.CSSProperties}
        />
        <div className={styles.ticks} aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className={styles.tick} />
          ))}
        </div>
        <input
          className={styles.input}
          type="range"
          min={0}
          max={MAX_PERCENT}
          step={1}
          value={muted ? 0 : percent}
          disabled={muted}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`Volume de ${label}, perçu par vous uniquement`}
        />
      </div>
      <span className="w-11 shrink-0 text-right font-mono text-[11px] text-dust tabular-nums">
        {muted ? "-∞" : `${formatDb(percent)}dB`}
      </span>
    </div>
  );
}
