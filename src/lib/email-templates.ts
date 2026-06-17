/**
 * Eenvoudige, merk-conforme HTML-mails. E-mailclients negeren externe CSS, dus
 * alle stijl staat inline. Kleuren komen overeen met het CoreBuild-systeem
 * (primair #0049db). Geen tracking, geen externe afbeeldingen.
 */

const PRIMARY = "#0049db";
const TEXT = "#1b1b21";
const MUTED = "#5d5d66";
const BORDER = "#e3e1ec";

function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="nl">
<body style="margin:0;background:#faf8ff;font-family:Inter,Arial,Helvetica,sans-serif;color:${TEXT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8ff;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid ${BORDER};">
          <span style="font-size:20px;font-weight:700;color:${PRIMARY};letter-spacing:-0.01em;">CoreBuild</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${TEXT};">${heading}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${BORDER};">
          <p style="margin:0;font-size:12px;color:${MUTED};">
            Je ontvangt deze e-mail omdat er een actie is aangevraagd op corebuildnl.com.
            Was jij dit niet? Dan kun je deze e-mail negeren.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">${label}</a>`;
}

const EMERALD = "#10B981";

function euro(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export interface PriceDropItem {
  name: string;
  oldCents: number;
  newCents: number;
  productUrl: string;
}

/** Prijsdaling-melding: lijst met gedaalde producten + link per product. */
export function priceDropEmail(items: PriceDropItem[]): string {
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};">
          <div style="font-size:14px;font-weight:600;color:${TEXT};margin-bottom:4px;">${it.name}</div>
          <div style="font-size:13px;color:${MUTED};">
            <span style="text-decoration:line-through;">${euro(it.oldCents)}</span>
            &rarr; <span style="color:${EMERALD};font-weight:700;">${euro(it.newCents)}</span>
          </div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};text-align:right;vertical-align:middle;">
          <a href="${it.productUrl}" style="color:${PRIMARY};font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap;">Bekijk &rarr;</a>
        </td>
      </tr>`
    )
    .join("");

  const heading =
    items.length === 1 ? "Een product op je volglijst is goedkoper" : "Producten op je volglijst zijn goedkoper";

  return layout(
    heading,
    `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};">
       Goed nieuws — de prijs is gedaald sinds je deze begon te volgen:
     </p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
       ${rows}
     </table>
     <p style="margin:0 0 24px;">${button("https://corebuildnl.com/volglijst", "Naar je volglijst")}</p>
     <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
       Je krijgt deze melding omdat je e-mailalerts hebt aangezet voor dit product.
       Zet ze uit op je volglijst.
     </p>`
  );
}

/** E-mailverificatie: knop om het account te activeren + platte-tekst-fallback. */
export function verifyEmail(url: string): string {
  return layout(
    "Bevestig je e-mailadres",
    `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">
       Welkom bij CoreBuild! Klik op de knop hieronder om je e-mailadres te
       bevestigen en je account te activeren.
     </p>
     <p style="margin:0 0 24px;">${button(url, "E-mailadres bevestigen")}</p>
     <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
       Werkt de knop niet? Kopieer dan deze link naar je browser:<br/>
       <a href="${url}" style="color:${PRIMARY};word-break:break-all;">${url}</a>
     </p>`
  );
}

/** Wachtwoord-reset: knop + platte-tekst-fallback van de link. */
export function resetPasswordEmail(url: string): string {
  return layout(
    "Stel je wachtwoord opnieuw in",
    `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">
       Klik op de knop hieronder om een nieuw wachtwoord te kiezen. Deze link is
       1 uur geldig.
     </p>
     <p style="margin:0 0 24px;">${button(url, "Wachtwoord opnieuw instellen")}</p>
     <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
       Werkt de knop niet? Kopieer dan deze link naar je browser:<br/>
       <a href="${url}" style="color:${PRIMARY};word-break:break-all;">${url}</a>
     </p>`
  );
}
