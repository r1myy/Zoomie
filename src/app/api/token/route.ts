import { NextRequest, NextResponse } from "next/server";
import { createRoomToken, makeIdentity } from "@/lib/livekit/token";
import { getOrCreateRoom, getRoom } from "@/lib/rooms/store";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const roomCode = typeof body?.roomCode === "string" ? body.roomCode.trim().toUpperCase() : "";
  const displayName = typeof body?.name === "string" ? body.name.trim() : "";
  const wantsHost = Boolean(body?.host);

  if (!roomCode || !displayName) {
    return NextResponse.json({ error: "roomCode et name sont requis." }, { status: 400 });
  }

  const identity = makeIdentity(displayName);

  try {
    const existing = await getRoom(roomCode);
    if (!existing && !wantsHost) {
      return NextResponse.json(
        { error: "Cette salle n'existe pas ou plus." },
        { status: 404 }
      );
    }
    let hostUserId: string | null = null;
    if (wantsHost && !existing) {
      const session = await createSessionClient();
      const {
        data: { user },
      } = await session.auth.getUser();
      hostUserId = user?.id ?? null;
    }
    const room = await getOrCreateRoom(roomCode, wantsHost ? identity : undefined, hostUserId);

    if (room.locked && room.hostIdentity !== identity) {
      return NextResponse.json({ error: "Cette salle est verrouillée par l'hôte." }, { status: 403 });
    }

    const token = await createRoomToken({ roomCode, identity, displayName });
    return NextResponse.json({
      token,
      identity,
      wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL,
      isHost: room.hostIdentity === identity,
      locked: room.locked,
      waitingRoomEnabled: room.waitingRoomEnabled,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue." },
      { status: 500 }
    );
  }
}
