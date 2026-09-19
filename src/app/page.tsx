import { Suspense } from "react";
import { HeroFaderDemo } from "@/components/home/HeroFaderDemo";
import { JoinPanel } from "@/components/home/JoinPanel";
import { AccountBadge } from "@/components/home/AccountBadge";
import { ComparisonSection } from "@/components/home/ComparisonSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { UseCasesSection } from "@/components/home/UseCasesSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { Reveal } from "@/components/home/Reveal";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const accountName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() || user?.email || null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-console/80 px-6 py-4 backdrop-blur-md sm:px-10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal" />
          <span className="font-display text-xl font-bold tracking-tight text-paper">
            ZOOMIE
          </span>
        </div>
        <nav className="hidden items-center gap-6 font-mono text-xs uppercase tracking-[0.15em] text-dust md:flex">
          <a href="#comment-ca-marche" className="hover:text-paper">
            Comment ça marche
          </a>
          <a href="#cas-usage" className="hover:text-paper">
            Cas d&apos;usage
          </a>
        </nav>
        <AccountBadge name={accountName} />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-12 px-6 py-16 sm:flex-row sm:items-center sm:gap-16 sm:py-20">
        <div className="max-w-md text-center sm:text-left">
          <p
            className="hero-rise mb-3 font-mono text-xs uppercase tracking-[0.2em] text-teal"
            style={{ animationDelay: "0ms" }}
          >
            Votre volume. Votre écoute.
          </p>
          <h1
            className="hero-rise font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-paper sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Réglez chaque
            <br />
            voix, pour vous.
          </h1>
          <p
            className="hero-rise mt-5 text-base leading-relaxed text-dust"
            style={{ animationDelay: "160ms" }}
          >
            Zoomie est une visioconférence où chaque participant ajuste, de son côté et en
            direct, le volume de chacun des autres — sans jamais changer ce qu&apos;ils
            s&apos;entendent entre eux. Comme une console de mixage, mais pour vos réunions.
          </p>
          <div
            className="hero-rise mt-7 flex flex-wrap items-center justify-center gap-4 sm:justify-start"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href="#commencer"
              className="rounded-sm bg-amber px-5 py-2.5 text-sm font-semibold text-console transition-colors hover:bg-amber-dim"
            >
              Créer une réunion
            </a>
            <a
              href="#comment-ca-marche"
              className="text-sm font-medium text-dust transition-colors hover:text-paper"
            >
              Comment ça marche ↓
            </a>
          </div>
        </div>

        <div className="hero-rise" style={{ animationDelay: "200ms" }}>
          <HeroFaderDemo />
        </div>
      </main>

      <ComparisonSection />
      <HowItWorksSection />
      <UseCasesSection />
      <FeaturesSection />

      <section id="commencer" className="border-t border-line px-6 py-24 sm:px-10">
        <Reveal className="mx-auto mb-10 max-w-lg text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">Prêt ?</p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-paper sm:text-5xl">
            Votre prochaine réunion commence ici.
          </h2>
        </Reveal>
        <Reveal delayMs={150} className="flex justify-center">
          <Suspense fallback={null}>
            <JoinPanel accountName={accountName} />
          </Suspense>
        </Reveal>
      </section>

      <footer className="border-t border-line px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            <span className="font-display text-sm font-bold text-paper">ZOOMIE</span>
            <span className="font-mono text-[11px] text-dust-dim">
              · une console de mixage pour vos réunions
            </span>
          </div>
          <p className="font-mono text-[11px] text-dust-dim">
            Accès invité, sans installation — Chrome, Edge et Firefox récents.
          </p>
        </div>
      </footer>
    </div>
  );
}
