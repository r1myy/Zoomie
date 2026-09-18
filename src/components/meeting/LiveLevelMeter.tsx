"use client";

import { useEffect, useRef, useState } from "react";
import { LevelMeter } from "@/components/mixer/LevelMeter";

export function LiveLevelMeter({ getLevel }: { getLevel: () => number }) {
  const [level, setLevel] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      setLevel(getLevel());
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [getLevel]);

  return <LevelMeter level={level} />;
}
