import { NextRequest, NextResponse } from "next/server";
import { generateRoomCode } from "@/lib/roomCode";
import { addInvitees, createScheduledRoom, getRoom, markInviteesInvited } from "@/lib/rooms/store";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { sendMeetingInvite } from "@/lib/email/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function uniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateRoomCode();
    if (!(await getRoom(code))) return code;
  }
  throw new Error("Impossible de générer un code de salle unique, réessayez.");
}

export async function POST(request: NextRequest) {
  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Connectez-vous pour planifier une réunion." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const scheduledAt = typeof body?.scheduledAt === "number" ? body.scheduledAt : NaN;
  const rawEmails = Array.isArray(body?.emails) ? (body.emails as unknown[]) : [];

  if (!title) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }
  if (!Number.isFinite(scheduledAt) || scheduledAt <= Date.now()) {
    return NextResponse.json(
      { error: "La date et l'heure doivent être dans le futur." },
      { status: 400 }
    );
  }

  const emails = Array.from(
    new Set(
      rawEmails
        .filter((e): e is string => typeof e === "string")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e))
    )
  );

  try {
    const code = await uniqueRoomCode();
    await createScheduledRoom({ code, hostUserId: user.id, title, scheduledAt });

    const joinUrl = `${request.nextUrl.origin}/r/${code}`;

    if (emails.length > 0) {
      const invitees = await addInvitees(code, emails);
      const sentIds: string[] = [];
      await Promise.all(
        invitees.map(async (invitee) => {
          try {
            await sendMeetingInvite({
              to: invitee.email,
              title,
              roomCode: code,
              scheduledAt,
              joinUrl,
            });
            sentIds.push(invitee.id);
          } catch {
            // Un échec d'envoi individuel (courriel invalide, clé Resend
            // absente...) ne doit pas faire échouer toute la planification —
            // la réunion existe déjà et reste consultable dans l'historique.
          }
        })
      );
      await markInviteesInvited(sentIds);
    }

    return NextResponse.json({ roomCode: code, joinUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue." },
      { status: 500 }
    );
  }
}
