import { NextRequest, NextResponse } from "next/server";
import { isHost, listPendingJoinRequests } from "@/lib/rooms/store";

// Sondé par l'hôte pour voir qui attend d'être admis.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const roomCode = code.toUpperCase();
  const callerIdentity = request.nextUrl.searchParams.get("callerIdentity") ?? "";

  try {
    if (!(await isHost(roomCode, callerIdentity))) {
      return NextResponse.json(
        { error: "Seul l'hôte peut voir la salle d'attente." },
        { status: 403 }
      );
    }

    const pending = (await listPendingJoinRequests(roomCode)).map((r) => ({
      id: r.id,
      displayName: r.displayName,
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ pending });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue." },
      { status: 500 }
    );
  }
}
