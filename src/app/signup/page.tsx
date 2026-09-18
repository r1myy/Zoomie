"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      // Confirmation par courriel activée sur le projet Supabase.
      setConfirmSent(true);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (confirmSent) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-2xl font-bold text-paper">Vérifiez vos courriels</h1>
          <p className="mt-2 text-sm text-dust">
            Un lien de confirmation a été envoyé à {email}. Cliquez dessus pour activer votre
            compte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-md border border-line bg-panel p-6">
        <h1 className="font-display text-2xl font-bold text-paper">Créer un compte</h1>
        <p className="mt-1 text-sm text-dust">Gardez vos réunions et vos préférences.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Votre nom</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Sophie Tremblay"
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper placeholder:text-dust-dim focus-visible:outline-teal"
            />
          </label>
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
              minLength={6}
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
            {loading ? "Création…" : "Créer le compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-dust">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-teal hover:underline">
            Se connecter
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
