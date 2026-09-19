"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AccountBadge({
  name,
  avatarUrl,
}: {
  name: string | null;
  avatarUrl?: string | null;
}) {
  const router = useRouter();

  if (!name) {
    return (
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.15em] text-dust">
        <Link href="/login" className="hover:text-paper">
          Se connecter
        </Link>
        <span className="text-dust-dim">·</span>
        <Link href="/signup" className="hover:text-paper">
          Créer un compte
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.15em] text-dust">
      <Link href="/account" className="flex items-center gap-2 text-paper hover:underline">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar hébergé sur Supabase Storage
          <img
            src={avatarUrl}
            alt=""
            className="h-5 w-5 shrink-0 rounded-full border border-line object-cover"
          />
        ) : null}
        <span className="max-w-[9rem] truncate">{name}</span>
      </Link>
      <span className="text-dust-dim">·</span>
      <Link href="/history" className="hover:text-paper">
        Mes réunions
      </Link>
      <span className="text-dust-dim">·</span>
      <button
        type="button"
        onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.refresh();
        }}
        className="hover:text-paper"
      >
        Se déconnecter
      </button>
    </div>
  );
}
