"use client";

import { Reveal } from "@/components/home/Reveal";
import { HowItWorksDiagram } from "@/components/home/HowItWorksDiagram";

export function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className="border-t border-line px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
            Comment ça marche
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-paper sm:text-5xl">
            Chaque voix reste séparée — jusqu&apos;à vous.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-dust">
            La plupart des mixeurs combinent l&apos;audio avant de vous l&apos;envoyer. Zoomie
            garde le flux de chaque participant à part sur tout le trajet — c&apos;est votre
            appareil, pas le serveur, qui applique vos réglages. Votre curseur ne change que ce
            que <span className="text-paper">vous</span> entendez.
          </p>
        </Reveal>
      </div>

      <Reveal delayMs={150} className="mt-14">
        <HowItWorksDiagram />
      </Reveal>
    </section>
  );
}
