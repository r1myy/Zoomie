"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMeetingRoom } from "@/lib/livekit/useMeetingRoom";
import { ParticipantTile } from "@/components/meeting/ParticipantTile";
import { Toolbar } from "@/components/meeting/Toolbar";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { HostPanel } from "@/components/meeting/HostPanel";

interface TokenResponse {
  token: string;
  identity: string;
  wsUrl: string;
  isHost: boolean;
  locked: boolean;
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
  const [sidePanel, setSidePanel] = useState<"chat" | "participants" | null>(null);
  const requestedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!name) {
      router.replace(`/?join=${roomCode}`);
      return;
    }
    // Next.js dev (Strict Mode) invokes effects twice; each call to /api/token
    // mints a brand-new random identity server-side, so a duplicate call would
    // silently create a second, unused "host" identity for the same room. This
    // guard makes sure exactly one token request ever leaves for this page.
    const key = `${roomCode}:${name}:${wantsHost}`;
    if (requestedKeyRef.current === key) return;
    requestedKeyRef.current = key;

    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, name, host: wantsHost }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Impossible de rejoindre la réunion.");
        setSession(data);
      })
      .catch((err) => {
        setJoinError(err instanceof Error ? err.message : "Erreur inconnue.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, name, wantsHost]);

  const meeting = useMeetingRoom({
    wsUrl: session?.wsUrl,
    token: session?.token,
    identity: session?.identity,
    roomCode,
    isHost: session?.isHost,
    initialLocked: session?.locked,
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

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-dust-dim">Connexion à la salle {roomCode}…</p>
      </div>
    );
  }

  const localTile = meeting.tiles.find((t) => t.isLocal);
  const remoteTiles = meeting.tiles.filter((t) => !t.isLocal);
  const screenShareTile = meeting.tiles.find((t) => t.isScreenShare);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal" />
          <span className="font-display text-lg font-bold text-paper">ZOOMIE</span>
          <span className="font-mono text-xs text-dust-dim">· {roomCode}</span>
          {meeting.roomLocked && (
            <span className="rounded-sm bg-danger/15 px-2 py-0.5 font-mono text-[10px] uppercase text-danger">
              🔒 verrouillée
            </span>
          )}
        </div>
        {meeting.error && <p className="text-xs text-danger">{meeting.error}</p>}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
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
              />
            )}
            {remoteTiles.map((tile) => (
              <ParticipantTile
                key={tile.identity}
                tile={tile}
                getLevel={meeting.getLevel}
                onVolumeChange={meeting.setParticipantVolume}
                onToggleMute={meeting.toggleParticipantMute}
              />
            ))}
          </div>
        </div>
        {sidePanel === "chat" && (
          <div className="w-72 shrink-0">
            <ChatPanel messages={meeting.messages} onSend={meeting.sendChat} />
          </div>
        )}
        {sidePanel === "participants" && (
          <div className="w-72 shrink-0">
            <HostPanel
              roomCode={roomCode}
              tiles={meeting.tiles}
              isHost={meeting.isHost}
              roomLocked={meeting.roomLocked}
              hostActionError={meeting.hostActionError}
              onToggleLock={meeting.toggleRoomLock}
              onMute={meeting.hostMuteParticipant}
              onRemove={meeting.hostRemoveParticipant}
            />
          </div>
        )}
      </div>

      <Toolbar
        micOn={localTile?.micEnabled ?? false}
        camOn={localTile?.camEnabled ?? false}
        sharing={meeting.screenShareBy === session.identity}
        chatOpen={sidePanel === "chat"}
        participantsOpen={sidePanel === "participants"}
        onToggleMic={meeting.toggleMic}
        onToggleCam={meeting.toggleCam}
        onToggleShare={meeting.toggleScreenShare}
        onToggleChat={() => setSidePanel((v) => (v === "chat" ? null : "chat"))}
        onToggleParticipants={() => setSidePanel((v) => (v === "participants" ? null : "participants"))}
        onLeave={() => {
          meeting.leave();
          router.push("/");
        }}
      />
    </div>
  );
}
