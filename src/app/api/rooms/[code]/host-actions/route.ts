import { NextRequest, NextResponse } from "next/server";
import {
  endMeetingForEveryone,
  muteParticipantMicrophone,
  removeParticipant,
} from "@/lib/livekit/hostActions";
import { createRoomToken } from "@/lib/livekit/token";
import {
  getJoinRequest,
  getRoom,
  isHost,
  setJoinRequestDecision,
  setRoomLocked,
  setWaitingRoomEnabled,
} from "@/lib/rooms/store";

type HostAction =
  | "mute"
  | "remove"
  | "lock"
  | "unlock"
  | "admit"
  | "deny"
  | "enable-waiting-room"
  | "disable-waiting-room"
  | "end-meeting";

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
  const targetRequestId = typeof body?.targetRequestId === "string" ? body.targetRequestId : undefined;

  try {
    if (!(await getRoom(roomCode))) {
      return NextResponse.json({ error: "Salle inconnue." }, { status: 404 });
    }
    if (!(await isHost(roomCode, callerIdentity))) {
      return NextResponse.json(
        { error: "Seul l'hôte de la salle peut faire ceci." },
        { status: 403 }
      );
    }

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
        await setRoomLocked(roomCode, true);
        break;
      case "unlock":
        await setRoomLocked(roomCode, false);
        break;
      case "enable-waiting-room":
        await setWaitingRoomEnabled(roomCode, true);
        break;
      case "disable-waiting-room":
        await setWaitingRoomEnabled(roomCode, false);
        break;
      case "end-meeting":
        await endMeetingForEveryone(roomCode);
        break;
      case "admit": {
        if (!targetRequestId) throw new Error("targetRequestId requis.");
        const joinRequest = await getJoinRequest(targetRequestId);
        if (!joinRequest || joinRequest.roomCode !== roomCode) {
          throw new Error("Demande introuvable.");
        }
        const token = await createRoomToken({
          roomCode,
          identity: joinRequest.identity,
          displayName: joinRequest.displayName,
        });
        await setJoinRequestDecision(targetRequestId, "admitted", token);
        break;
      }
      case "deny": {
        if (!targetRequestId) throw new Error("targetRequestId requis.");
        await setJoinRequestDecision(targetRequestId, "denied");
        break;
      }
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
