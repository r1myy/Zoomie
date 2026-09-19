"use client";

import { FaderIcon } from "@/components/home/icons";

const STREAMS = [
  { name: "Léa", color: "var(--teal)", y: 70 },
  { name: "Théo", color: "var(--amber)", y: 170 },
  { name: "Nadia", color: "var(--dust)", y: 270 },
];

const CURVES = [
  "M188,70 C 330,70 330,170 460,170",
  "M188,170 C 330,170 330,170 460,170",
  "M188,270 C 330,270 330,170 460,170",
];

export function HowItWorksDiagram() {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 620 340"
        className="mx-auto h-auto w-full max-w-xl"
        role="img"
        aria-label="Trois flux audio distincts, chacun de sa propre couleur, voyagent séparément jusqu'à un point d'arrivée unique où vous les mixez individuellement."
      >
        {STREAMS.map((s, i) => (
          <path
            key={s.name}
            d={CURVES[i]}
            fill="none"
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="3 11"
            className="signal-flow"
            style={{ animationDelay: `${i * -0.4}s`, opacity: 0.85 }}
          />
        ))}

        {STREAMS.map((s) => (
          <g key={s.name}>
            <rect
              x={8}
              y={s.y - 26}
              width={180}
              height={52}
              rx={10}
              fill="var(--console-panel)"
              stroke={s.color}
              strokeOpacity={0.5}
            />
            <circle cx={34} cy={s.y} r={5} fill={s.color} />
            <text
              x={52}
              y={s.y + 5}
              fill="var(--paper)"
              fontFamily="var(--font-plex-sans)"
              fontSize={16}
            >
              {s.name}
            </text>
          </g>
        ))}

        <circle cx={520} cy={170} r={62} fill="var(--console)" stroke="var(--amber)" strokeWidth={2} />
        <foreignObject x={490} y={140} width={60} height={60}>
          <div className="flex h-full w-full items-center justify-center text-amber">
            <FaderIcon />
          </div>
        </foreignObject>
        <text
          x={520}
          y={252}
          textAnchor="middle"
          fill="var(--paper)"
          fontFamily="var(--font-big-shoulders)"
          fontWeight={700}
          fontSize={18}
          letterSpacing={1}
        >
          VOUS
        </text>
      </svg>
    </div>
  );
}
