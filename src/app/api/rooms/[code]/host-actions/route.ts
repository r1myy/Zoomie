import { NextRequest, NextResponse } from "next/server";
import { muteParticipantMicrophone, removeParticipant } from "@/lib/livekit/hostActions";
import { getRoom, isHost, setRoomLocked } from "@/lib/rooms/store";

type HostAction = "mute" | "remove" | "lock" | "unlock";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const roomCode = code.toUpperCase();
  const body = await request.json().catch(() => null);
  const callerIdentity = typeof body?.callerIdentity === "string" ? body.callerIdentity : "";
  const action = body?.action as HostAction | undefined;
  const targetIdentity = typeof body?.targetIdentity === "string" ? body.targetIdentity : undefined;

  if (!getRoom(roomCode)) {
    return NextResponse.json({ error: "Salle inconnue." }, { status: 404 });
  }
  if (!isHost(roomCode, callerIdentity)) {
    return NextResponse.json(
      { error: "Seul l'hôte de la salle peut faire ceci." },
      { status: 403 }
    );
  }

  try {
    switch (action) {
      case "mute":
        if (!targetIdentity) throw new Error("targetIdentity requis.");
        await muteParticipantMicrophone(roomCode, targetIdentity);
        break;
      case "remove":
        if (!targetIdentity) throw new Error("targetIdentity requis.");
        await removeParticipant(roomCode, targetIdentity);
        break;
      case "lock":
        setRoomLocked(roomCode, true);
        break;
      case "unlock":
        setRoomLocked(roomCode, false);
        break;
      default:
        return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue." },
      { status: 500 }
    );
  }
}
