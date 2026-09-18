"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMeetingRoom } from "@/lib/livekit/useMeetingRoom";
import { ParticipantTile } from "@/components/meeting/ParticipantTile";
import { Toolbar } from "@/components/meeting/Toolbar";
import { ChatPanel } from "@/components/meeting/ChatPanel";

interface TokenResponse {
  token: string;
  identity: string;
  wsUrl: string;
  isHost: boolean;
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
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!name) {
      router.replace(`/?join=${roomCode}`);
      return;
    }
    let cancelled = false;
    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, name, host: wantsHost }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Impossible de rejoindre la réunion.");
        if (!cancelled) setSession(data);
      })
      .catch((err) => {
        if (!cancelled) setJoinError(err instanceof Error ? err.message : "Erreur inconnue.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, name, wantsHost]);

  const meeting = useMeetingRoom({
    wsUrl: session?.wsUrl,
    token: session?.token,
    identity: session?.identity,
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
        {chatOpen && <div className="w-72 shrink-0"><ChatPanel messages={meeting.messages} onSend={meeting.sendChat} /></div>}
      </div>

      <Toolbar
        micOn={localTile?.micEnabled ?? false}
        camOn={localTile?.camEnabled ?? false}
        sharing={meeting.screenShareBy === session.identity}
        chatOpen={chatOpen}
        onToggleMic={meeting.toggleMic}
        onToggleCam={meeting.toggleCam}
        onToggleShare={meeting.toggleScreenShare}
        onToggleChat={() => setChatOpen((v) => !v)}
        onLeave={() => {
          meeting.leave();
          router.push("/");
        }}
      />
    </div>
  );
}
