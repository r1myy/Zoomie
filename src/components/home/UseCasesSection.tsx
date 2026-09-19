"use client";

import { Reveal } from "@/components/home/Reveal";
import { FaderIcon, MicIcon, WaveformIcon } from "@/components/home/icons";

const USE_CASES = [
  {
    icon: FaderIcon,
    title: "Réunions d'équipe",
    body: "Baissez la personne qui a un mauvais micro sans lui demander de se couper — vous seul entendez la différence.",
  },
  {
    icon: WaveformIcon,
    title: "Musique et podcasts à distance",
    body: "Chaque musicien règle son propre retour, comme sur une console — sans toucher à ce que les autres entendent.",
  },
  {
    icon: MicIcon,
    title: "Formations et ateliers",
    body: "L'animateur monte le co-animateur et baisse les questions du public, à son rythme, sans gêner personne.",
  },
];

export function UseCasesSection() {
  return (
    <section id="cas-usage" className="border-t border-line px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Reveal className="max-w-lg">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">Conçu pour</p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-paper sm:text-5xl">
            Chaque écoute est différente.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {USE_CASES.map((useCase, i) => (
            <Reveal key={useCase.title} delayMs={i * 120}>
              <div className="h-full rounded-md border border-line bg-panel p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-line bg-console text-amber">
                  <useCase.icon />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-paper">
                  {useCase.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-dust">{useCase.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
