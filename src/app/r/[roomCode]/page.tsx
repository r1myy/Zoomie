"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMeetingRoom } from "@/lib/livekit/useMeetingRoom";
import { ParticipantTile } from "@/components/meeting/ParticipantTile";
import { Toolbar } from "@/components/meeting/Toolbar";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { HostPanel } from "@/components/meeting/HostPanel";
import { DeviceSettings } from "@/components/meeting/DeviceSettings";
import { LeaveConfirmDialog } from "@/components/meeting/LeaveConfirmDialog";
import type { LeftMeetingReason } from "@/lib/livekit/useMeetingRoom";

const LEFT_REASON_COPY: Record<LeftMeetingReason, { title: string; body: string }> = {
  left: {
    title: "Vous avez quitté la réunion",
    body: "À bientôt.",
  },
  ended: {
    title: "Réunion terminée",
    body: "L'hôte a terminé la réunion pour tout le monde.",
  },
  removed: {
    title: "Vous avez été exclu",
    body: "L'hôte vous a retiré de cette réunion.",
  },
  disconnected: {
    title: "Connexion interrompue",
    body: "La connexion à la réunion a été perdue.",
  },
};

interface TokenResponse {
  token: string;
  identity: string;
  wsUrl: string;
  isHost: boolean;
  locked: boolean;
  waitingRoomEnabled: boolean;
}

export default function MeetingRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const roomCode = decodeURIComponent(params.roomCode).toUpperCase();
  const name = search.get("name") ?? "";
  const wantsHost = search.get("host") === "1";

  const [session, setSession] = useState<TokenResponse | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [waitingRequestId, setWaitingRequestId] = useState<string | null>(null);
  const [sidePanel, setSidePanel] = useState<"chat" | "participants" | "devices" | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const requestedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!name) {
      router.replace(`/?join=${roomCode}`);
      return;
    }
    // Next.js dev (Strict Mode) invokes effects twice; each call mints a
    // brand-new random identity server-side, so a duplicate call would
    // silently create a second, unused identity for the same room. This
    // guard makes sure exactly one join request ever leaves for this page.
    const key = `${roomCode}:${name}:${wantsHost}`;
    if (requestedKeyRef.current === key) return;
    requestedKeyRef.current = key;

    // L'hôte entre directement ; un participant passe par la demande de
    // jonction, qui admet immédiatement si la salle d'attente est désactivée.
    const url = wantsHost ? "/api/token" : `/api/rooms/${roomCode}/join-request`;
    const bodyPayload = wantsHost ? { roomCode, name, host: true } : { name };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Impossible de rejoindre la réunion.");
        if (data.status === "pending") {
          setWaitingRequestId(data.requestId);
          return;
        }
        setSession({
          token: data.token,
          identity: data.identity,
          wsUrl: data.wsUrl,
          isHost: Boolean(data.isHost),
          locked: Boolean(data.locked),
          waitingRoomEnabled: Boolean(data.waitingRoomEnabled),
        });
      })
      .catch((err) => {
        setJoinError(err instanceof Error ? err.message : "Erreur inconnue.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, name, wantsHost]);

  // Sondage pendant l'attente en salle d'attente : dès que l'hôte admet ou
  // refuse, on bascule vers la session ou vers l'erreur.
  useEffect(() => {
    if (!waitingRequestId) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomCode}/join-request/${waitingRequestId}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.status === "admitted") {
          setSession({
            token: data.token,
            identity: data.identity,
            wsUrl: data.wsUrl,
            isHost: false,
            locked: false,
            waitingRoomEnabled: false,
          });
          setWaitingRequestId(null);
        } else if (data.status === "denied") {
          setJoinError("L'hôte a refusé votre demande d'accès à cette réunion.");
          setWaitingRequestId(null);
        }
      } catch {
        // ignore transient polling errors
      }
    };

    const interval = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [waitingRequestId, roomCode]);

  const meeting = useMeetingRoom({
    wsUrl: session?.wsUrl,
    token: session?.token,
    identity: session?.identity,
    roomCode,
    isHost: session?.isHost,
    initialLocked: session?.locked,
    initialWaitingRoomEnabled: session?.waitingRoomEnabled,
  });

  if (joinError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-2xl font-bold text-paper">Impossible de rejoindre</p>
        <p className="max-w-sm text-sm text-dust">{joinError}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-2 rounded-sm bg-amber px-4 py-2 text-sm font-semibold text-console"
        >
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  if (waitingRequestId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
        <p className="font-display text-2xl font-bold text-paper">Salle d&apos;attente</p>
        <p className="max-w-sm text-sm text-dust">
          {name}, l&apos;hôte de la salle {roomCode} doit vous admettre avant que vous puissiez
          entrer. Cette page se mettra à jour automatiquement.
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-dust-dim">Connexion à la salle {roomCode}…</p>
      </div>
    );
  }

  if (meeting.leftReason) {
    const copy = LEFT_REASON_COPY[meeting.leftReason];
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-2xl font-bold text-paper">{copy.title}</p>
        <p className="max-w-sm text-sm text-dust">{copy.body}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-2 rounded-sm bg-amber px-4 py-2 text-sm font-semibold text-console"
        >
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  const localTile = meeting.tiles.find((t) => t.isLocal);
  const remoteTiles = meeting.tiles.filter((t) => !t.isLocal);
  const screenShareTile = meeting.tiles.find((t) => t.isScreenShare);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-teal" />
          <span className="font-display text-lg font-bold text-paper">ZOOMIE</span>
          <span className="font-mono text-xs text-dust-dim">· {roomCode}</span>
          {meeting.roomLocked && (
            <span className="rounded-sm bg-danger/15 px-2 py-0.5 font-mono text-[10px] uppercase text-danger">
              🔒 verrouillée
            </span>
          )}
        </div>
        {meeting.error && (
          <p className="w-full text-xs text-danger sm:w-auto">{meeting.error}</p>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-y-auto p-4 ${sidePanel ? "hidden sm:block" : ""}`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {screenShareTile && (
              <ParticipantTile
                key={`${screenShareTile.identity}-screen`}
                tile={screenShareTile}
                getLevel={meeting.getLevel}
                onVolumeChange={meeting.setParticipantVolume}
                onToggleMute={meeting.toggleParticipantMute}
                wide
              />
            )}
            {localTile && (
              <ParticipantTile
                tile={localTile}
                getLevel={meeting.getLevel}
                onVolumeChange={meeting.setParticipantVolume}
                onToggleMute={meeting.toggleParticipantMute}
                isSpeaking={meeting.activeSpeakerIds.includes(localTile.identity)}
              />
            )}
            {remoteTiles.map((tile) => (
              <ParticipantTile
                key={tile.identity}
                tile={tile}
                getLevel={meeting.getLevel}
                onVolumeChange={meeting.setParticipantVolume}
                onToggleMute={meeting.toggleParticipantMute}
                isSpeaking={meeting.activeSpeakerIds.includes(tile.identity)}
              />
            ))}
          </div>
        </div>
        {sidePanel === "chat" && (
          <div className="w-full shrink-0 sm:w-72">
            <ChatPanel messages={meeting.messages} onSend={meeting.sendChat} />
          </div>
        )}
        {sidePanel === "participants" && (
          <div className="w-full shrink-0 sm:w-72">
            <HostPanel
              roomCode={roomCode}
              tiles={meeting.tiles}
              isHost={meeting.isHost}
              roomLocked={meeting.roomLocked}
              hostActionError={meeting.hostActionError}
              waitingRoomEnabled={meeting.waitingRoomEnabled}
              pendingRequests={meeting.pendingRequests}
              masterPercent={meeting.masterPercent}
              onMasterVolumeChange={meeting.setMasterPercent}
              onToggleLock={meeting.toggleRoomLock}
              onToggleWaitingRoom={meeting.toggleWaitingRoom}
              onAdmit={meeting.admitRequest}
              onDeny={meeting.denyRequest}
              onMute={meeting.hostMuteParticipant}
              onRemove={meeting.hostRemoveParticipant}
            />
          </div>
        )}
        {sidePanel === "devices" && (
          <div className="w-full shrink-0 sm:w-72">
            <DeviceSettings onSwitchDevice={meeting.switchDevice} />
          </div>
        )}
      </div>

      <Toolbar
        micOn={localTile?.micEnabled ?? false}
        camOn={localTile?.camEnabled ?? false}
        sharing={meeting.screenShareBy === session.identity}
        chatOpen={sidePanel === "chat"}
        participantsOpen={sidePanel === "participants"}
        devicesOpen={sidePanel === "devices"}
        handRaised={localTile?.handRaised ?? false}
        onToggleMic={meeting.toggleMic}
        onToggleCam={meeting.toggleCam}
        onToggleShare={meeting.toggleScreenShare}
        onToggleChat={() => setSidePanel((v) => (v === "chat" ? null : "chat"))}
        onToggleParticipants={() => setSidePanel((v) => (v === "participants" ? null : "participants"))}
        onToggleDevices={() => setSidePanel((v) => (v === "devices" ? null : "devices"))}
        onSendReaction={meeting.sendReaction}
        onToggleHand={meeting.toggleRaiseHand}
        onOpenLeaveConfirm={() => setLeaveDialogOpen(true)}
      />

      {leaveDialogOpen && (
        <LeaveConfirmDialog
          isHost={meeting.isHost}
          onCancel={() => setLeaveDialogOpen(false)}
          onLeaveOnly={() => {
            setLeaveDialogOpen(false);
            meeting.leave();
            router.push("/");
          }}
          onEndForEveryone={async () => {
            setLeaveDialogOpen(false);
            await meeting.endMeetingForEveryone();
            router.push("/");
          }}
        />
      )}
    </div>
  );
}
