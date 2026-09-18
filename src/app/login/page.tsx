"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Courriel ou mot de passe incorrect."
          : error.message
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-md border border-line bg-panel p-6">
        <h1 className="font-display text-2xl font-bold text-paper">Se connecter</h1>
        <p className="mt-1 text-sm text-dust">Retrouvez vos réunions et vos salles.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Courriel</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper focus-visible:outline-teal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Mot de passe</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper focus-visible:outline-teal"
            />
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-amber px-4 py-2.5 text-sm font-semibold text-console transition-colors hover:bg-amber-dim disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-dust">
          Pas de compte ?{" "}
          <Link href="/signup" className="text-teal hover:underline">
            Créer un compte
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-dust-dim">
          <Link href="/" className="hover:text-paper">
            Continuer sans compte
          </Link>
        </p>
      </div>
    </div>
  );
}
