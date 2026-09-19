"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/home/Reveal";

const ZOOMIE_LEVELS = [38, 82, 58];

export function ComparisonSection() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setGrown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGrown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="border-t border-line bg-panel px-6 py-20 sm:px-10">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1.1fr_1fr] md:items-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
            Ce que les autres ne font pas
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-paper sm:text-5xl">
            Un mixage automatique, pour tout le monde pareil.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-dust">
            Zoom, Meet, Teams : chaque participant est mixé dans un seul signal. Vous avez, au
            mieux, un volume de sortie global — ou une coupure micro côté animateur. Aucun ne
            vous laisse baisser une seule voix sans la couper pour tout le monde.
          </p>
        </Reveal>

        <Reveal delayMs={150}>
          <div ref={panelRef} className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-line bg-panel-raised p-4">
              <p className="font-mono text-[10px] uppercase tracking-wide text-dust-dim">
                Mixage serveur
              </p>
              <div className="mt-4 flex h-28 items-end justify-center">
                <div className="h-1/2 w-10 rounded-sm bg-dust-dim/50" />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-dust">
                Un seul niveau, imposé à tous.
              </p>
            </div>

            <div className="rounded-md border border-teal/30 bg-panel-raised p-4">
              <p className="font-mono text-[10px] uppercase tracking-wide text-teal">Zoomie</p>
              <div className="mt-4 flex h-28 items-end justify-center gap-2">
                {ZOOMIE_LEVELS.map((level, i) => (
                  <div key={i} className="h-full w-3.5 overflow-hidden rounded-sm bg-console flex items-end">
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-amber-dim to-amber transition-[height] duration-700 ease-out"
                      style={{ height: grown ? `${level}%` : "0%" }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-dust">
                Un curseur par personne, réglé par vous.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
