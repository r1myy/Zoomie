import { AccessToken } from "livekit-server-sdk";

export function makeIdentity(displayName: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${displayName.trim().slice(0, 40)}#${suffix}`;
}

export async function createRoomToken({
  roomCode,
  identity,
  displayName,
  canPublish = true,
  metadata,
}: {
  roomCode: string;
  identity: string;
  displayName: string;
  canPublish?: boolean;
  metadata?: string;
}) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      "LIVEKIT_API_KEY / LIVEKIT_API_SECRET manquants — copiez .env.local.example en .env.local"
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: displayName,
    ttl: "4h",
    metadata,
  });
  at.addGrant({
    room: roomCode,
    roomJoin: true,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  return at.toJwt();
}
