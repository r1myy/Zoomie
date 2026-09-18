"use client";

import type { TileState, WaitingParticipant } from "@/lib/livekit/useMeetingRoom";
import { InviteSection } from "@/components/meeting/InviteSection";
import { MasterVolumeSection } from "@/components/meeting/MasterVolumeSection";

export function HostPanel({
  roomCode,
  tiles,
  isHost,
  roomLocked,
  hostActionError,
  waitingRoomEnabled,
  pendingRequests,
  masterPercent,
  onMasterVolumeChange,
  onToggleLock,
  onToggleWaitingRoom,
  onAdmit,
  onDeny,
  onMute,
  onRemove,
}: {
  roomCode: string;
  tiles: TileState[];
  isHost: boolean;
  roomLocked: boolean;
  hostActionError: string | null;
  waitingRoomEnabled: boolean;
  pendingRequests: WaitingParticipant[];
  masterPercent: number;
  onMasterVolumeChange: (percent: number) => void;
  onToggleLock: () => void;
  onToggleWaitingRoom: () => void;
  onAdmit: (requestId: string) => void;
  onDeny: (requestId: string) => void;
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

      <MasterVolumeSection percent={masterPercent} onChange={onMasterVolumeChange} />

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
        {isHost && (
          <button
            type="button"
            onClick={onToggleWaitingRoom}
            className={`mt-2 w-full rounded-sm border px-3 py-2 text-left text-sm font-medium transition-colors ${
              waitingRoomEnabled
                ? "border-teal/40 bg-teal/10 text-paper"
                : "border-line bg-console text-dust hover:text-paper"
            }`}
          >
            {waitingRoomEnabled
              ? "🕒 Salle d'attente activée — les arrivants attendent votre accord"
              : "Activer la salle d'attente"}
          </button>
        )}
        {hostActionError && <p className="mt-2 text-xs text-danger">{hostActionError}</p>}
      </div>

      {isHost && pendingRequests.length > 0 && (
        <div className="border-b border-line bg-amber/5 px-4 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-amber">
            En attente ({pendingRequests.length})
          </p>
          <div className="space-y-2">
            {pendingRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-sm border border-amber/30 bg-console px-3 py-2"
              >
                <span className="text-sm text-paper">{r.displayName}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onAdmit(r.id)}
                    className="rounded-sm bg-teal px-2 py-1 text-xs font-semibold text-console hover:opacity-90"
                  >
                    Admettre
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeny(r.id)}
                    className="rounded-sm border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/10"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  aria-label={`Couper le micro de ${tile.name.split("#")[0]} pour tout le monde`}
                  className="rounded-sm border border-line px-2 py-1 text-xs text-dust hover:border-amber/40 hover:text-paper"
                >
                  🔇
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(tile.identity)}
                  title="Exclure de la réunion"
                  aria-label={`Exclure ${tile.name.split("#")[0]} de la réunion`}
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
