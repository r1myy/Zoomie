"use client";

import type { TileState } from "@/lib/livekit/useMeetingRoom";
import { InviteSection } from "@/components/meeting/InviteSection";

export function HostPanel({
  roomCode,
  tiles,
  isHost,
  roomLocked,
  hostActionError,
  onToggleLock,
  onMute,
  onRemove,
}: {
  roomCode: string;
  tiles: TileState[];
  isHost: boolean;
  roomLocked: boolean;
  hostActionError: string | null;
  onToggleLock: () => void;
  onMute: (identity: string) => void;
  onRemove: (identity: string) => void;
}) {
  const remote = tiles.filter((t) => !t.isLocal);

  return (
    <div className="flex h-full flex-col border-l border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-paper">
          Participants
        </h2>
        <p className="mt-0.5 font-mono text-[10px] text-dust-dim">
          {tiles.length} dans la salle
        </p>
      </div>

      <InviteSection roomCode={roomCode} />

      <div className="border-b border-line px-4 py-3">
        {isHost ? (
          <button
            type="button"
            onClick={onToggleLock}
            className={`w-full rounded-sm border px-3 py-2 text-left text-sm font-medium transition-colors ${
              roomLocked
                ? "border-danger/40 bg-danger/10 text-danger"
                : "border-line bg-console text-paper hover:border-teal/40"
            }`}
          >
            {roomLocked ? "🔒 Salle verrouillée — cliquez pour déverrouiller" : "🔓 Verrouiller la salle"}
          </button>
        ) : (
          <p className="font-mono text-[11px] text-dust-dim">
            {roomLocked ? "🔒 Salle verrouillée par l'hôte" : "🔓 Salle ouverte"}
          </p>
        )}
        {hostActionError && <p className="mt-2 text-xs text-danger">{hostActionError}</p>}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {remote.length === 0 && (
          <p className="text-sm text-dust-dim">Vous êtes seul pour l&apos;instant.</p>
        )}
        {remote.map((tile) => (
          <div
            key={tile.identity}
            className="flex items-center justify-between rounded-sm border border-line bg-console px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${tile.micEnabled ? "bg-teal" : "bg-dust-dim"}`} />
              <span className="text-sm text-paper">{tile.name.split("#")[0]}</span>
            </div>
            {isHost && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onMute(tile.identity)}
                  title="Couper le micro pour tout le monde"
                  className="rounded-sm border border-line px-2 py-1 text-xs text-dust hover:border-amber/40 hover:text-paper"
                >
                  🔇
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(tile.identity)}
                  title="Exclure de la réunion"
                  className="rounded-sm border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/10"
                >
                  ⏻
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
