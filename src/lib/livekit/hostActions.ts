import { RoomServiceClient, TrackSource } from "livekit-server-sdk";

function client() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    throw new Error("Configuration LiveKit manquante (LIVEKIT_URL / clés).");
  }
  return new RoomServiceClient(url, apiKey, apiSecret);
}

// Coupe réellement le micro d'un participant pour tout le monde — distinct du
// mixeur individuel (section 4.3), qui ne change que ce que l'utilisateur qui
// règle son curseur entend, lui.
export async function muteParticipantMicrophone(roomCode: string, targetIdentity: string) {
  const svc = client();
  const participant = await svc.getParticipant(roomCode, targetIdentity);
  const micTrack = participant.tracks.find((t) => t.source === TrackSource.MICROPHONE);
  if (!micTrack) return;
  await svc.mutePublishedTrack(roomCode, targetIdentity, micTrack.sid, true);
}

export async function removeParticipant(roomCode: string, targetIdentity: string) {
  await client().removeParticipant(roomCode, targetIdentity);
}

// Utilisé avant de reprendre le rôle hôte pour un propriétaire qui revient
// (voir reclaimRoomIfOwner) : si son ancienne session est encore active
// (ex. deux onglets connectés au même compte), on ne lui vole pas le rôle
// hôte en dessous des pieds.
export async function isParticipantConnected(roomCode: string, identity: string): Promise<boolean> {
  if (!identity) return false;
  try {
    const participants = await client().listParticipants(roomCode);
    return participants.some((p) => p.identity === identity);
  } catch {
    // Salle LiveKit inexistante (personne connecté) — donc personne à protéger.
    return false;
  }
}

// Déconnecte tout le monde d'un coup (DisconnectReason.ROOM_DELETED côté
// client) — distinct de "quitter seul", qui laisse la réunion continuer
// pour les autres.
export async function endMeetingForEveryone(roomCode: string) {
  await client().deleteRoom(roomCode);
}
