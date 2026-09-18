"use client";

import { useState } from "react";

export function InviteSection({ roomCode }: { roomCode: string }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const link = typeof window !== "undefined" ? `${window.location.origin}/r/${roomCode}` : "";
  const message = `Rejoignez ma réunion Zoomie : ${link} (code : ${roomCode})`;

  async function copy(value: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setShareError("Impossible de copier — copiez-le manuellement.");
    }
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: "Zoomie", text: message, url: link });
    } catch {
      // l'utilisateur a annulé le partage — rien à signaler
    }
  }

  return (
    <div className="border-b border-line px-4 py-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-dust-dim">
        Inviter des participants
      </p>

      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded-sm border border-line bg-console px-2 py-1.5 font-mono text-[11px] text-dust focus-visible:outline-teal"
        />
        <button
          type="button"
          onClick={() => copy(link, "link")}
          className="shrink-0 rounded-sm bg-amber px-2.5 py-1.5 text-xs font-semibold text-console hover:bg-amber-dim"
        >
          {copied === "link" ? "Copié !" : "Copier"}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => copy(roomCode, "code")}
          className="rounded-sm border border-line px-2 py-1 font-mono text-[11px] text-dust hover:border-teal/40 hover:text-paper"
        >
          Code : {roomCode} {copied === "code" && "· copié !"}
        </button>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={nativeShare}
            className="rounded-sm border border-line px-2 py-1 text-xs text-dust hover:border-teal/40 hover:text-paper"
          >
            Partager…
          </button>
        )}

        <a
          href={`mailto:?subject=${encodeURIComponent("Invitation à une réunion Zoomie")}&body=${encodeURIComponent(message)}`}
          className="rounded-sm border border-line px-2 py-1 text-xs text-dust hover:border-teal/40 hover:text-paper"
        >
          Courriel
        </a>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm border border-line px-2 py-1 text-xs text-dust hover:border-teal/40 hover:text-paper"
        >
          WhatsApp
        </a>
      </div>

      {shareError && <p className="mt-1.5 text-xs text-danger">{shareError}</p>}
    </div>
  );
}
