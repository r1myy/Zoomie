"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { generateRoomCode, isValidRoomCode } from "@/lib/roomCode";

const NAME_KEY = "zoomie:display-name";

export function JoinPanel({ accountName }: { accountName?: string | null }) {
  const router = useRouter();
  const search = useSearchParams();
  const invitedCode = search.get("join")?.toUpperCase() ?? "";
  const [mode, setMode] = useState<"create" | "join" | "schedule">(
    invitedCode ? "join" : "create"
  );
  const [name, setName] = useState(accountName ?? "");
  const [code, setCode] = useState(invitedCode);
  const [error, setError] = useState<string | null>(null);

  // Rempli après l'hydratation pour éviter tout écart serveur/client sur la
  // valeur du champ contrôlé — la préférence est propre à ce navigateur.
  // Un compte connecté a priorité sur la dernière valeur saisie localement.
  useEffect(() => {
    if (accountName) return;
    const saved = window.localStorage.getItem(NAME_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync one-time read from localStorage on mount
    if (saved) setName(saved);
  }, [accountName]);

  function persistName(value: string) {
    setName(value);
    window.localStorage.setItem(NAME_KEY, value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Entrez votre nom pour continuer.");
      return;
    }
    if (mode === "create") {
      const roomCode = generateRoomCode();
      router.push(`/r/${roomCode}?name=${encodeURIComponent(name.trim())}&host=1`);
      return;
    }
    if (!isValidRoomCode(code)) {
      setError("Ce code de salle ne semble pas valide (format XXX-XXX).");
      return;
    }
    router.push(`/r/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`);
  }

  return (
    <div className="w-full max-w-sm rounded-md border border-line bg-panel-raised p-5">
      <div className="mb-4 flex gap-1 rounded-sm bg-console p-1">
        {(["create", "join", "schedule"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex-1 rounded-sm py-2 text-xs font-medium transition-colors sm:text-sm ${
              mode === m ? "bg-panel-raised text-paper" : "text-dust hover:text-paper"
            }`}
          >
            {m === "create" ? "Créer" : m === "join" ? "Rejoindre" : "Planifier"}
          </button>
        ))}
      </div>

      {mode === "schedule" ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-dust">
            Fixez une date, invitez par courriel — chacun reçoit une invitation, puis un rappel
            avant le début.
          </p>
          <Link
            href="/schedule"
            className="block w-full rounded-sm bg-amber px-4 py-2.5 text-center text-sm font-semibold text-console transition-colors hover:bg-amber-dim"
          >
            Planifier une réunion
          </Link>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-dust">Votre nom</span>
          <input
            value={name}
            onChange={(e) => persistName(e.target.value)}
            placeholder="Ex. Sophie Tremblay"
            className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper placeholder:text-dust-dim focus-visible:outline-teal"
          />
        </label>

        {mode === "join" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Code de la salle</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXX-XXX"
              className="w-full rounded-sm border border-line bg-console px-3 py-2 font-mono text-sm uppercase tracking-widest text-paper placeholder:text-dust-dim focus-visible:outline-teal"
            />
          </label>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-sm bg-amber px-4 py-2.5 text-sm font-semibold text-console transition-colors hover:bg-amber-dim"
        >
          {mode === "create" ? "Créer et rejoindre" : "Rejoindre la salle"}
        </button>
      </form>
      )}
    </div>
  );
}
