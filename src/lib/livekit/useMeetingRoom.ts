"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  LocalParticipant,
  LocalVideoTrack,
  Participant,
  RemoteParticipant,
  RemoteVideoTrack,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import { MixerEngine } from "@/lib/audio/mixerEngine";
import { getStoredVolume, setStoredVolume } from "@/lib/audio/volumePrefs";

export interface TileState {
  identity: string;
  name: string;
  isLocal: boolean;
  videoTrack?: LocalVideoTrack | RemoteVideoTrack;
  isScreenShare: boolean;
  micEnabled: boolean;
  camEnabled: boolean;
  volumePercent: number;
  muted: boolean;
}

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  at: number;
}

const CHAT_TOPIC = "chat";

function tileFromParticipant(p: Participant, isLocal: boolean): TileState {
  const stored = isLocal ? { percent: 100, muted: false } : getStoredVolume(p.name || p.identity);
  return {
    identity: p.identity,
    name: p.name || p.identity,
    isLocal,
    videoTrack: undefined,
    isScreenShare: false,
    micEnabled: p.isMicrophoneEnabled,
    camEnabled: p.isCameraEnabled,
    volumePercent: stored.percent,
    muted: stored.muted,
  };
}

export function useMeetingRoom({
  wsUrl,
  token,
  identity,
}: {
  wsUrl?: string;
  token?: string;
  identity?: string;
}) {
  const roomRef = useRef<Room | null>(null);
  const mixerRef = useRef<MixerEngine | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [tiles, setTiles] = useState<Record<string, TileState>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [masterPercent, setMasterPercentState] = useState(100);
  const [screenShareBy, setScreenShareBy] = useState<string | null>(null);

  const patchTile = useCallback((id: string, patch: Partial<TileState>) => {
    setTiles((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }, []);

  useEffect(() => {
    if (!wsUrl || !token) return;

    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;
    const mixer = new MixerEngine();
    mixerRef.current = mixer;

    const upsertFromParticipant = (p: Participant, isLocal: boolean) => {
      setTiles((prev) => ({ ...prev, [p.identity]: prev[p.identity] ?? tileFromParticipant(p, isLocal) }));
    };

    room.on(RoomEvent.ConnectionStateChanged, setConnectionState);

    room.on(RoomEvent.ParticipantConnected, (p) => upsertFromParticipant(p, false));
    room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
      mixer.removeParticipant(p.identity);
      setTiles((prev) => {
        const next = { ...prev };
        delete next[p.identity];
        return next;
      });
      setScreenShareBy((cur) => (cur === p.identity ? null : cur));
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio && track.mediaStreamTrack) {
        mixer.addParticipantTrack(participant.identity, track.mediaStreamTrack);
        const stored = getStoredVolume(participant.name || participant.identity);
        mixer.setParticipantPercent(participant.identity, stored.muted ? 0 : stored.percent);
      }
      if (track.kind === Track.Kind.Video) {
        const isScreenShare = publication.source === Track.Source.ScreenShare;
        upsertFromParticipant(participant, false);
        patchTile(participant.identity, {
          videoTrack: track as RemoteVideoTrack,
          isScreenShare,
        });
        if (isScreenShare) setScreenShareBy(participant.identity);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        mixer.removeParticipant(participant.identity);
      }
      if (track.kind === Track.Kind.Video) {
        patchTile(participant.identity, { videoTrack: undefined, isScreenShare: false });
        if (publication.source === Track.Source.ScreenShare) {
          setScreenShareBy((cur) => (cur === participant.identity ? null : cur));
        }
      }
    });

    room.on(RoomEvent.TrackMuted, (pub, participant) => {
      if (pub.kind === Track.Kind.Audio) patchTile(participant.identity, { micEnabled: false });
      if (pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera) {
        patchTile(participant.identity, { camEnabled: false });
      }
    });
    room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
      if (pub.kind === Track.Kind.Audio) patchTile(participant.identity, { micEnabled: true });
      if (pub.kind === Track.Kind.Video && pub.source === Track.Source.Camera) {
        patchTile(participant.identity, { camEnabled: true });
      }
    });

    room.registerTextStreamHandler(CHAT_TOPIC, (reader, participantInfo) => {
      reader.readAll().then((text) => {
        const sender = room.getParticipantByIdentity(participantInfo.identity);
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            from: sender?.name || participantInfo.identity,
            text,
            at: Date.now(),
          },
        ]);
      });
    });

    room.on(RoomEvent.Disconnected, () => setConnectionState(ConnectionState.Disconnected));

    (async () => {
      try {
        await room.connect(wsUrl, token);
        await mixer.resume();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de rejoindre la réunion.");
        return;
      }

      upsertFromParticipant(room.localParticipant, true);

      // L'accès caméra/micro peut échouer indépendamment de la connexion à la
      // salle (périphérique absent, permission refusée) — ça ne doit pas
      // empêcher de rejoindre en mode audio/vidéo dégradé.
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch {
        setError("Micro indisponible — vérifiez les autorisations du navigateur.");
      }
      try {
        await room.localParticipant.setCameraEnabled(true);
        const localVideoPub = room.localParticipant.videoTrackPublications
          .values()
          .next().value;
        if (localVideoPub?.videoTrack) {
          patchTile(room.localParticipant.identity, {
            videoTrack: localVideoPub.videoTrack as LocalVideoTrack,
          });
        }
      } catch {
        setError((prev) => prev ?? "Caméra indisponible — vérifiez les autorisations du navigateur.");
      }
    })();

    return () => {
      mixer.dispose();
      room.disconnect();
      roomRef.current = null;
      mixerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl, token]);

  const setParticipantVolume = useCallback(
    (targetIdentity: string, percent: number) => {
      mixerRef.current?.setParticipantPercent(targetIdentity, percent);
      patchTile(targetIdentity, { volumePercent: percent });
      setTiles((prev) => {
        const tile = prev[targetIdentity];
        if (tile) setStoredVolume(tile.name, percent, tile.muted);
        return prev;
      });
    },
    [patchTile]
  );

  const toggleParticipantMute = useCallback(
    (targetIdentity: string) => {
      setTiles((prev) => {
        const tile = prev[targetIdentity];
        if (!tile) return prev;
        const nextMuted = !tile.muted;
        mixerRef.current?.setParticipantPercent(targetIdentity, nextMuted ? 0 : tile.volumePercent);
        setStoredVolume(tile.name, tile.volumePercent, nextMuted);
        return { ...prev, [targetIdentity]: { ...tile, muted: nextMuted } };
      });
    },
    []
  );

  const setMasterPercent = useCallback((percent: number) => {
    mixerRef.current?.setMasterPercent(percent);
    setMasterPercentState(percent);
  }, []);

  const getLevel = useCallback((targetIdentity: string) => {
    return mixerRef.current?.getParticipantLevel(targetIdentity) ?? 0;
  }, []);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    patchTile(room.localParticipant.identity, { micEnabled: !enabled });
  }, [patchTile]);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const enabled = room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(!enabled);
    patchTile(room.localParticipant.identity, { camEnabled: !enabled });
    const pub = room.localParticipant.videoTrackPublications.values().next().value;
    patchTile(room.localParticipant.identity, {
      videoTrack: (pub?.videoTrack as LocalVideoTrack) ?? undefined,
    });
  }, [patchTile]);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const local = room.localParticipant as LocalParticipant;
    const sharing = local.isScreenShareEnabled;
    if (!sharing && screenShareBy && screenShareBy !== local.identity) {
      setError("Une seule personne peut partager son écran à la fois.");
      return;
    }
    await local.setScreenShareEnabled(!sharing);
    setScreenShareBy(!sharing ? local.identity : null);
  }, [screenShareBy]);

  const sendChat = useCallback((text: string) => {
    const room = roomRef.current;
    const trimmed = text.trim();
    if (!room || !trimmed) return;
    void room.localParticipant.sendText(trimmed, { topic: CHAT_TOPIC });
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-local`,
        from: room.localParticipant.name || room.localParticipant.identity,
        text: trimmed,
        at: Date.now(),
      },
    ]);
  }, []);

  const leave = useCallback(() => {
    roomRef.current?.disconnect();
  }, []);

  return {
    connectionState,
    tiles: Object.values(tiles),
    localIdentity: identity,
    messages,
    error,
    masterPercent,
    screenShareBy,
    setParticipantVolume,
    toggleParticipantMute,
    setMasterPercent,
    getLevel,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    sendChat,
    leave,
  };
}
