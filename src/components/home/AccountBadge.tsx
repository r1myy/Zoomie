"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AccountBadge({ name }: { name: string | null }) {
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
    <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.15em] text-dust">
      <span className="text-paper">{name}</span>
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
