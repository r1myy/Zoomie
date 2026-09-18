import { NextRequest, NextResponse } from "next/server";
import { getJoinRequest } from "@/lib/rooms/store";

// Sondé par le participant en salle d'attente pour savoir s'il a été admis.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string; requestId: string }> }
) {
  const { requestId } = await params;
  try {
    const joinRequest = await getJoinRequest(requestId);
    if (!joinRequest) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    if (joinRequest.status === "admitted") {
      return NextResponse.json({
        status: "admitted",
        token: joinRequest.token,
        identity: joinRequest.identity,
        wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_WS_URL,
      });
    }

    return NextResponse.json({ status: joinRequest.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue." },
      { status: 500 }
    );
  }
}
