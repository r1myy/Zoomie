"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  DisconnectReason,
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
import {
  getPreferredAudioDevice,
  getPreferredOutputDevice,
  getPreferredVideoDevice,
  setPreferredAudioDevice,
  setPreferredOutputDevice,
  setPreferredVideoDevice,
} from "@/lib/media/devicePrefs";

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
  handRaised: boolean;
  reaction: { emoji: string; id: number } | null;
}

export type LeftMeetingReason = "left" | "ended" | "removed" | "disconnected";

export interface ChatMessage {
  id: string;
  from: string;
  text: string;
  at: number;
}

const CHAT_TOPIC = "chat";
const ROOM_STATE_TOPIC = "room-state";
const REACTION_TOPIC = "reaction";
const REACTION_DURATION_MS = 2500;

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
    handRaised: false,
    reaction: null,
  };
}

export interface WaitingParticipant {
  id: string;
  displayName: string;
  createdAt: number;
}

export function useMeetingRoom({
  wsUrl,
  token,
  identity,
  roomCode,
  isHost,
  initialLocked,
  initialWaitingRoomEnabled,
}: {
  wsUrl?: string;
  token?: string;
  identity?: string;
  roomCode?: string;
  isHost?: boolean;
  initialLocked?: boolean;
  initialWaitingRoomEnabled?: boolean;
}) {
  const roomRef = useRef<Room | null>(null);
  const mixerRef = useRef<MixerEngine | null>(null);
  const selfInitiatedRef = useRef<"left" | "ended" | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [tiles, setTiles] = useState<Record<string, TileState>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [masterPercent, setMasterPercentState] = useState(100);
  const [screenShareBy, setScreenShareBy] = useState<string | null>(null);
  const [roomLocked, setRoomLocked] = useState(Boolean(initialLocked));
  const [hostActionError, setHostActionError] = useState<string | null>(null);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(Boolean(initialWaitingRoomEnabled));
  const [pendingRequests, setPendingRequests] = useState<WaitingParticipant[]>([]);
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<string[]>([]);
  const [leftReason, setLeftReason] = useState<LeftMeetingReason | null>(null);

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
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      setActiveSpeakerIds(speakers.map((p) => p.identity));
    });

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

    room.registerTextStreamHandler(ROOM_STATE_TOPIC, (reader) => {
      reader.readAll().then((text) => {
        try {
          const parsed = JSON.parse(text) as { locked: boolean };
          setRoomLocked(parsed.locked);
        } catch {
          // ignore malformed payloads
        }
      });
    });

    room.registerTextStreamHandler(REACTION_TOPIC, (reader, participantInfo) => {
      reader.readAll().then((text) => {
        try {
          const parsed = JSON.parse(text) as
            | { kind: "burst"; emoji: string }
            | { kind: "hand"; raised: boolean };
          if (parsed.kind === "burst") {
            const reactionId = Date.now();
            patchTile(participantInfo.identity, { reaction: { emoji: parsed.emoji, id: reactionId } });
            setTimeout(() => {
              setTiles((prev) => {
                const tile = prev[participantInfo.identity];
                if (!tile || tile.reaction?.id !== reactionId) return prev;
                return { ...prev, [participantInfo.identity]: { ...tile, reaction: null } };
              });
            }, REACTION_DURATION_MS);
          } else if (parsed.kind === "hand") {
            patchTile(participantInfo.identity, { handRaised: parsed.raised });
          }
        } catch {
          // ignore malformed payloads
        }
      });
    });

    room.on(RoomEvent.Disconnected, (reason) => {
      setConnectionState(ConnectionState.Disconnected);
      if (selfInitiatedRef.current) {
        setLeftReason(selfInitiatedRef.current);
      } else if (reason === DisconnectReason.ROOM_DELETED) {
        setLeftReason("ended");
      } else if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        setLeftReason("removed");
      } else {
        setLeftReason("disconnected");
      }
    });

    (async () => {
      try {
        await room.connect(wsUrl, token);
        await mixer.resume();
        const preferredOutput = getPreferredOutputDevice();
        if (preferredOutput && mixer.outputDeviceSelectionSupported) {
          await mixer.setOutputDevice(preferredOutput).catch(() => {});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de rejoindre la réunion.");
        return;
      }

      upsertFromParticipant(room.localParticipant, true);

      // L'accès caméra/micro peut échouer indépendamment de la connexion à la
      // salle (périphérique absent, permission refusée) — ça ne doit pas
      // empêcher de rejoindre en mode audio/vidéo dégradé.
      const preferredAudio = getPreferredAudioDevice();
      const preferredVideo = getPreferredVideoDevice();

      try {
        await room.localParticipant.setMicrophoneEnabled(
          true,
          preferredAudio ? { deviceId: preferredAudio } : undefined
        );
      } catch {
        setError("Micro indisponible — vérifiez les autorisations du navigateur.");
      }
      try {
        await room.localParticipant.setCameraEnabled(
          true,
          preferredVideo ? { deviceId: preferredVideo } : undefined
        );
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

  // L'hôte sonde la salle d'attente — pas de temps réel sans Supabase pour
  // l'instant, un court intervalle suffit pour une liste qui reste courte.
  useEffect(() => {
    if (!isHost || !roomCode || !identity) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/rooms/${roomCode}/waiting-list?callerIdentity=${encodeURIComponent(identity)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setPendingRequests(data.pending ?? []);
      } catch {
        // ignore transient polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isHost, roomCode, identity]);

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

  const switchDevice = useCallback(
    async (kind: "audioinput" | "videoinput" | "audiooutput", deviceId: string) => {
      if (kind === "audiooutput") {
        // La sortie ne passe pas par LiveKit (rendu audio désactivé, tout
        // transite par le mixeur individuel) : c'est le mixeur qui choisit
        // le haut-parleur, pas room.switchActiveDevice.
        await mixerRef.current?.setOutputDevice(deviceId);
        setPreferredOutputDevice(deviceId);
        return;
      }
      const room = roomRef.current;
      if (!room) return;
      await room.switchActiveDevice(kind, deviceId);
      if (kind === "audioinput") setPreferredAudioDevice(deviceId);
      else setPreferredVideoDevice(deviceId);
    },
    []
  );

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

  const sendReaction = useCallback((emoji: string) => {
    const room = roomRef.current;
    if (!room) return;
    void room.localParticipant.sendText(JSON.stringify({ kind: "burst", emoji }), {
      topic: REACTION_TOPIC,
    });
    const reactionId = Date.now();
    patchTile(room.localParticipant.identity, { reaction: { emoji, id: reactionId } });
    setTimeout(() => {
      setTiles((prev) => {
        const tile = prev[room.localParticipant.identity];
        if (!tile || tile.reaction?.id !== reactionId) return prev;
        return { ...prev, [room.localParticipant.identity]: { ...tile, reaction: null } };
      });
    }, REACTION_DURATION_MS);
  }, [patchTile]);

  const toggleRaiseHand = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    setTiles((prev) => {
      const tile = prev[room.localParticipant.identity];
      if (!tile) return prev;
      const next = !tile.handRaised;
      void room.localParticipant.sendText(JSON.stringify({ kind: "hand", raised: next }), {
        topic: REACTION_TOPIC,
      });
      return { ...prev, [room.localParticipant.identity]: { ...tile, handRaised: next } };
    });
  }, []);

  const leave = useCallback(() => {
    selfInitiatedRef.current = "left";
    roomRef.current?.disconnect();
  }, []);

  const callHostAction = useCallback(
    async (
      action:
        | "mute"
        | "remove"
        | "lock"
        | "unlock"
        | "admit"
        | "deny"
        | "enable-waiting-room"
        | "disable-waiting-room"
        | "end-meeting",
      opts?: { targetIdentity?: string; targetRequestId?: string }
    ) => {
      if (!roomCode || !identity) return false;
      setHostActionError(null);
      try {
        const res = await fetch(`/api/rooms/${roomCode}/host-actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callerIdentity: identity, action, ...opts }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Action refusée.");
        return true;
      } catch (err) {
        setHostActionError(err instanceof Error ? err.message : "Erreur inconnue.");
        return false;
      }
    },
    [roomCode, identity]
  );

  const hostMuteParticipant = useCallback(
    (targetIdentity: string) => callHostAction("mute", { targetIdentity }),
    [callHostAction]
  );

  const hostRemoveParticipant = useCallback(
    (targetIdentity: string) => callHostAction("remove", { targetIdentity }),
    [callHostAction]
  );

  const toggleRoomLock = useCallback(async () => {
    const next = !roomLocked;
    const ok = await callHostAction(next ? "lock" : "unlock");
    if (!ok) return;
    setRoomLocked(next);
    const room = roomRef.current;
    if (room) {
      void room.localParticipant.sendText(JSON.stringify({ locked: next }), {
        topic: ROOM_STATE_TOPIC,
      });
    }
  }, [roomLocked, callHostAction]);

  const toggleWaitingRoom = useCallback(async () => {
    const next = !waitingRoomEnabled;
    const ok = await callHostAction(next ? "enable-waiting-room" : "disable-waiting-room");
    if (!ok) return;
    setWaitingRoomEnabled(next);
  }, [waitingRoomEnabled, callHostAction]);

  const admitRequest = useCallback(
    async (requestId: string) => {
      const ok = await callHostAction("admit", { targetRequestId: requestId });
      if (ok) setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      return ok;
    },
    [callHostAction]
  );

  const denyRequest = useCallback(
    async (requestId: string) => {
      const ok = await callHostAction("deny", { targetRequestId: requestId });
      if (ok) setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      return ok;
    },
    [callHostAction]
  );

  // Termine la réunion pour tout le monde (RoomServiceClient.deleteRoom) —
  // distinct de leave(), qui laisse la réunion continuer sans l'hôte.
  const endMeetingForEveryone = useCallback(async () => {
    selfInitiatedRef.current = "ended";
    const ok = await callHostAction("end-meeting");
    if (!ok) {
      selfInitiatedRef.current = null;
    }
    // deleteRoom déclenche lui-même RoomEvent.Disconnected(ROOM_DELETED)
    // pour tout le monde, y compris l'hôte : pas besoin d'appeler
    // room.disconnect() ici.
    return ok;
  }, [callHostAction]);

  return {
    connectionState,
    tiles: Object.values(tiles),
    localIdentity: identity,
    messages,
    error,
    masterPercent,
    screenShareBy,
    isHost: Boolean(isHost),
    roomLocked,
    hostActionError,
    waitingRoomEnabled,
    pendingRequests,
    activeSpeakerIds,
    leftReason,
    setParticipantVolume,
    toggleParticipantMute,
    setMasterPercent,
    getLevel,
    toggleMic,
    toggleCam,
    switchDevice,
    toggleScreenShare,
    sendChat,
    hostMuteParticipant,
    hostRemoveParticipant,
    toggleRoomLock,
    toggleWaitingRoom,
    admitRequest,
    denyRequest,
    sendReaction,
    toggleRaiseHand,
    endMeetingForEveryone,
    leave,
  };
}
