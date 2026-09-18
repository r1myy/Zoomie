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
