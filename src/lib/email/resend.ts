import { Resend } from "resend";

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "Zoomie <onboarding@resend.dev>";

function client() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquant — copiez .env.local.example en .env.local");
  }
  return new Resend(apiKey);
}

function formatDateTime(epochMs: number) {
  return new Date(epochMs).toLocaleString("fr-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function emailShell(title: string, bodyHtml: string, joinUrl: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #17151c; color: #e9e4ef;">
      <p style="font-family: monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #4fc7b5; margin: 0 0 12px;">Zoomie</p>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #f5f2f9;">${title}</h1>
      ${bodyHtml}
      <a href="${joinUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #e3a548; color: #17151c; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 3px;">Rejoindre la réunion</a>
      <p style="margin-top: 24px; font-size: 12px; color: #968ca1;">Ou copiez ce lien : ${joinUrl}</p>
    </div>
  `;
}

export async function sendMeetingInvite({
  to,
  title,
  roomCode,
  scheduledAt,
  joinUrl,
}: {
  to: string;
  title: string;
  roomCode: string;
  scheduledAt: number;
  joinUrl: string;
}) {
  const html = emailShell(
    `Vous êtes invité(e) : ${title}`,
    `<p style="font-size: 14px; line-height: 1.6; color: #cabfd6;">Une réunion Zoomie est planifiée pour le <strong style="color: #f5f2f9;">${formatDateTime(scheduledAt)}</strong>.</p>
     <p style="font-family: monospace; font-size: 13px; color: #968ca1; margin-top: 8px;">Code de salle : ${roomCode}</p>`,
    joinUrl
  );
  await client().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Invitation — ${title}`,
    html,
  });
}

export async function sendMeetingReminder({
  to,
  title,
  roomCode,
  scheduledAt,
  joinUrl,
}: {
  to: string;
  title: string;
  roomCode: string;
  scheduledAt: number;
  joinUrl: string;
}) {
  const html = emailShell(
    `Ça commence bientôt : ${title}`,
    `<p style="font-size: 14px; line-height: 1.6; color: #cabfd6;">Rappel — votre réunion Zoomie débute à <strong style="color: #f5f2f9;">${formatDateTime(scheduledAt)}</strong>.</p>
     <p style="font-family: monospace; font-size: 13px; color: #968ca1; margin-top: 8px;">Code de salle : ${roomCode}</p>`,
    joinUrl
  );
  await client().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Rappel — ${title} commence bientôt`,
    html,
  });
}
