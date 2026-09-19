import { NextRequest, NextResponse } from "next/server";
import { getDueReminders, markReminderSent } from "@/lib/rooms/store";
import { sendMeetingReminder } from "@/lib/email/resend";

const REMINDER_WINDOW_MS = 60 * 60 * 1000; // rappel envoyé dans l'heure précédant la réunion

// Pas de cron intégré (l'app n'est pas encore déployée) : cette route est
// destinée à être appelée périodiquement par une tâche planifiée externe
// (ex. cron-job.org, ou Vercel Cron une fois déployé), protégée par
// CRON_SECRET pour empêcher un tiers de déclencher l'envoi de rappels.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const due = await getDueReminders(Date.now(), REMINDER_WINDOW_MS);
  const origin = request.nextUrl.origin;
  let sent = 0;

  for (const { invitee, room } of due) {
    if (!room.scheduledAt || !room.title) continue;
    try {
      await sendMeetingReminder({
        to: invitee.email,
        title: room.title,
        roomCode: room.code,
        scheduledAt: room.scheduledAt,
        joinUrl: `${origin}/r/${room.code}`,
      });
      await markReminderSent(invitee.id);
      sent++;
    } catch {
      // On réessaiera au prochain déclenchement (reminder_sent_at reste
      // null) plutôt que de faire échouer toute la passe pour un envoi.
    }
  }

  return NextResponse.json({ checked: due.length, sent });
}
