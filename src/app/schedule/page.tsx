"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function defaultDateTimeLocal() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SchedulePage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(defaultDateTimeLocal());
  const [emailsText, setEmailsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ roomCode: string; joinUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(Boolean(user));
      setCheckingAuth(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Donnez un titre à votre réunion.");
      return;
    }
    const scheduledAt = new Date(when).getTime();
    if (!Number.isFinite(scheduledAt) || scheduledAt <= Date.now()) {
      setError("Choisissez une date et une heure dans le futur.");
      return;
    }
    const emails = emailsText
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), scheduledAt, emails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible de planifier la réunion.");
      setResult({ roomCode: data.roomCode, joinUrl: data.joinUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-dust-dim">Chargement…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-2xl font-bold text-paper">Connectez-vous pour planifier</p>
        <p className="max-w-sm text-sm text-dust">
          Les réunions planifiées et les rappels par courriel sont réservés aux comptes Zoomie.
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-sm bg-amber px-4 py-2 text-sm font-semibold text-console hover:bg-amber-dim"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm rounded-md border border-line bg-panel p-6 text-center">
          <p className="font-display text-2xl font-bold text-paper">Réunion planifiée</p>
          <p className="mt-2 text-sm text-dust">
            Code de salle{" "}
            <span className="font-mono font-semibold text-paper">{result.roomCode}</span>
          </p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(result.joinUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-4 w-full rounded-sm border border-line bg-console px-4 py-2.5 text-sm font-medium text-paper hover:border-teal"
          >
            {copied ? "Lien copié ✓" : "Copier le lien d'invitation"}
          </button>
          <Link
            href="/history"
            className="mt-3 block rounded-sm bg-amber px-4 py-2.5 text-sm font-semibold text-console hover:bg-amber-dim"
          >
            Voir mes réunions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-md border border-line bg-panel p-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-paper">Planifier une réunion</h1>
          <Link href="/" className="text-xs text-dust hover:text-paper">
            Retour
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Titre</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Point d'équipe hebdomadaire"
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper placeholder:text-dust-dim focus-visible:outline-teal"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Date et heure</span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper focus-visible:outline-teal"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">
              Courriels des invités (optionnel)
            </span>
            <textarea
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              rows={3}
              placeholder="un courriel par ligne ou séparés par des virgules"
              className="w-full resize-none rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper placeholder:text-dust-dim focus-visible:outline-teal"
            />
            <span className="mt-1 block text-[11px] text-dust-dim">
              Chaque invité reçoit une invitation par courriel, puis un rappel une heure avant.
            </span>
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-sm bg-amber px-4 py-2.5 text-sm font-semibold text-console transition-colors hover:bg-amber-dim disabled:opacity-60"
          >
            {saving ? "Planification…" : "Planifier la réunion"}
          </button>
        </form>
      </div>
    </div>
  );
}
