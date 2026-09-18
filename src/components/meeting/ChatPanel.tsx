"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/livekit/useMeetingRoom";

export function ChatPanel({
  messages,
  onSend,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full flex-col border-l border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-paper">
          Discussion
        </h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-sm text-dust-dim">Aucun message pour l&apos;instant.</p>
        )}
        {messages.map((m) => (
          <div key={m.id}>
            <p className="font-mono text-[10px] uppercase tracking-wide text-dust-dim">
              {m.from.split("#")[0]}
            </p>
            <p className="text-sm text-paper">{m.text}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onSend(draft);
          setDraft("");
        }}
        className="flex gap-2 border-t border-line p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper placeholder:text-dust-dim focus-visible:outline-teal"
        />
        <button
          type="submit"
          className="rounded-sm bg-amber px-3 py-2 text-sm font-semibold text-console hover:bg-amber-dim"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
