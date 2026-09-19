import { NextRequest, NextResponse } from "next/server";
import { createRoomToken, makeIdentity } from "@/lib/livekit/token";
import { isParticipantConnected } from "@/lib/livekit/hostActions";
import { getRoom, createJoinRequest, reclaimRoomIfOwner } from "@/lib/rooms/store";
import { createClient as createSessionClient } from "@/lib/supabase/server";

// Point d'entrée pour un participant qui rejoint une salle existante via son
// code. Si la salle d'attente est désactivée, admet immédiatement (comme
// /api/token). Si elle est activée, crée une demande en attente que l'hôte
// devra admettre — voir /api/rooms/[code]/join-request/[requestId] pour le
// sondage du statut et /api/rooms/[code]/host-actions (admit/deny) côté
// hôte. Un compte propriétaire de la salle qui revient (nouvelle session,
// donc nouvelle identité LiveKit) reprend automatiquement la main, sans
// passer par le verrouillage ni la salle d'attente — voir
// reclaimRoomIfOwner.
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

    const identity = makeIdentity(displayName);

    const session = await createSessionClient();
    const {
      data: { user },
    } = await session.auth.getUser();

    // Si l'hôte a déjà une session active (ex. un autre onglet, même compte),
    // on ne lui reprend pas la main en dessous des pieds pour ce nouvel
    // arrivant — il rejoint comme un participant normal à la place.
    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
    const metadata = avatarUrl ? JSON.stringify({ avatarUrl }) : undefined;

    const currentHostStillConnected = await isParticipantConnected(roomCode, room.hostIdentity);
    const reclaimed = currentHostStillConnected
      ? undefined
      : await reclaimRoomIfOwner(roomCode, identity, user?.id);
    if (reclaimed) {
      const token = await createRoomToken({ roomCode, identity, displayName, metadata });
      return NextResponse.json({
        status: "admitted",
        token,
        identity,
        wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL,
        locked: reclaimed.locked,
        waitingRoomEnabled: reclaimed.waitingRoomEnabled,
        isHost: true,
      });
    }

    if (room.locked) {
      return NextResponse.json({ error: "Cette salle est verrouillée par l'hôte." }, { status: 403 });
    }

    if (!room.waitingRoomEnabled) {
      const token = await createRoomToken({ roomCode, identity, displayName, metadata });
      return NextResponse.json({
        status: "admitted",
        token,
        identity,
        wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL,
        locked: room.locked,
        waitingRoomEnabled: room.waitingRoomEnabled,
        isHost: false,
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
