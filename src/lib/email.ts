/**
 * E-mailverzending via Resend (REST API, geen extra dependency).
 *
 * Werkt zonder provider: zolang `RESEND_API_KEY` niet gezet is, logt deze
 * module een waarschuwing en doet niets — de app blijft dan gewoon draaien
 * (de wachtwoord-reset-flow toont nog steeds de neutrale bevestiging).
 *
 * Env:
 * - RESEND_API_KEY   — de Resend-API-sleutel (verplicht om echt te versturen)
 * - EMAIL_FROM       — afzender, bv. "CoreBuild <noreply@corebuildnl.com>".
 *                      Default = Resends testafzender (alleen naar de account-owner).
 *
 * Alleen server-side importeren (auth-config + API-routes).
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "CoreBuild <onboarding@resend.dev>";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY niet gezet — e-mail niet verstuurd: "${subject}"`);
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend-fout ${res.status}: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] versturen mislukt:", err);
    return false;
  }
}
