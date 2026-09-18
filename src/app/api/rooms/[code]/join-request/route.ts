import { NextRequest, NextResponse } from "next/server";
import { createRoomToken, makeIdentity } from "@/lib/livekit/token";
import { createJoinRequest, getRoom } from "@/lib/rooms/store";

// Point d'entrée pour un participant (non-hôte) qui rejoint une salle. Si la
// salle d'attente est désactivée, admet immédiatement (comme /api/token).
// Si elle est activée, crée une demande en attente que l'hôte devra admettre
// — voir /api/rooms/[code]/join-request/[requestId] pour le sondage du
// statut et /api/rooms/[code]/host-actions (admit/deny) côté hôte.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const roomCode = code.toUpperCase();
  const body = await request.json().catch(() => null);
  const displayName = typeof body?.name === "string" ? body.name.trim() : "";

  if (!displayName) {
    return NextResponse.json({ error: "name est requis." }, { status: 400 });
  }

  try {
    const room = await getRoom(roomCode);
    if (!room) {
      return NextResponse.json({ error: "Cette salle n'existe pas ou plus." }, { status: 404 });
    }
    if (room.locked) {
      return NextResponse.json({ error: "Cette salle est verrouillée par l'hôte." }, { status: 403 });
    }

    const identity = makeIdentity(displayName);

    if (!room.waitingRoomEnabled) {
      const token = await createRoomToken({ roomCode, identity, displayName });
      return NextResponse.json({
        status: "admitted",
        token,
        identity,
        wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL,
        locked: room.locked,
      });
    }

    const joinRequest = await createJoinRequest(roomCode, identity, displayName);
    return NextResponse.json({ status: "pending", requestId: joinRequest.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue." },
      { status: 500 }
    );
  }
}
