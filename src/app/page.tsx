import { Suspense } from "react";
import { HeroFaderDemo } from "@/components/home/HeroFaderDemo";
import { JoinPanel } from "@/components/home/JoinPanel";
import { AccountBadge } from "@/components/home/AccountBadge";
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
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal" />
          <span className="font-display text-xl font-bold tracking-tight text-paper">
            ZOOMIE
          </span>
        </div>
        <AccountBadge name={accountName} />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-6 py-12 sm:flex-row sm:items-center sm:gap-16">
        <div className="max-w-md text-center sm:text-left">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-teal">
            Votre volume. Votre écoute.
          </p>
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-paper sm:text-6xl">
            Réglez chaque
            <br />
            voix, pour vous.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-dust">
            Zoomie est une visioconférence où chaque participant ajuste, de son côté et en
            direct, le volume de chacun des autres — sans jamais changer ce qu&apos;ils
            s&apos;entendent entre eux. Comme une console de mixage, mais pour vos réunions.
          </p>
        </div>

        <HeroFaderDemo />
      </main>

      <section className="flex justify-center px-6 pb-16">
        <Suspense fallback={null}>
          <JoinPanel accountName={accountName} />
        </Suspense>
      </section>

      <footer className="border-t border-line px-6 py-6 text-center font-mono text-[11px] text-dust-dim">
        Accès invité, sans installation — Chrome, Edge et Firefox récents.
      </footer>
    </div>
  );
}
