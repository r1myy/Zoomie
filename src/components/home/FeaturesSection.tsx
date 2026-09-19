"use client";

import { Reveal } from "@/components/home/Reveal";
import {
  BrowserIcon,
  ClockIcon,
  HandIcon,
  LinkIcon,
  LockIcon,
  UserCheckIcon,
} from "@/components/home/icons";

const FEATURES = [
  {
    icon: ClockIcon,
    title: "Salle d'attente",
    body: "Activez-la pour approuver chaque arrivée avant qu'elle entre.",
  },
  {
    icon: LockIcon,
    title: "Contrôles hôte",
    body: "Coupez un micro, excluez, verrouillez la salle — en un geste.",
  },
  {
    icon: HandIcon,
    title: "Réactions en direct",
    body: "Levez la main, applaudissez, réagissez sans interrompre.",
  },
  {
    icon: LinkIcon,
    title: "Invitation en un clic",
    body: "Lien, code, courriel ou WhatsApp — partagez comme vous voulez.",
  },
  {
    icon: UserCheckIcon,
    title: "Comptes optionnels",
    body: "Rejoignez sans compte, ou connectez-vous pour retrouver vos réunions.",
  },
  {
    icon: BrowserIcon,
    title: "Aucune installation",
    body: "Ça marche dans le navigateur — Chrome, Edge, Firefox.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t border-line px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Reveal className="max-w-lg">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">
            Tout ce qu&apos;il faut pour une réunion
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-paper sm:text-5xl">
            Le mixeur n&apos;est que le début.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delayMs={(i % 3) * 100}>
              <div className="flex gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line bg-panel text-teal">
                  <feature.icon />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-paper">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-dust">{feature.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
