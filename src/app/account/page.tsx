"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setName((user.user_metadata?.full_name as string | undefined) ?? "");
      setEmail(user.email ?? "");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-dust-dim">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-md border border-line bg-panel p-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-paper">Mon compte</h1>
          <Link href="/" className="text-xs text-dust hover:text-paper">
            Retour
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Votre nom</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper focus-visible:outline-teal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Courriel</span>
            <input
              value={email}
              disabled
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-dust-dim"
            />
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}
          {saved && <p className="text-xs text-teal">Nom mis à jour.</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-sm bg-amber px-4 py-2.5 text-sm font-semibold text-console transition-colors hover:bg-amber-dim disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-dust-dim">
          Le microphone et la caméra par défaut se règlent depuis une réunion, dans le menu ⚙️.
        </p>
      </div>
    </div>
  );
}
