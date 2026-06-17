/**
 * Wegwerp-/tijdelijke-e-maildomeinen blokkeren bij registratie. Bewust een
 * curated subset van de bekendste aanbieders — een volledige lijst telt
 * duizenden domeinen en veroudert snel. Uitbreiden = een regel toevoegen.
 *
 * Alleen server-side gebruiken (auth-config). Social logins (Google/Microsoft/
 * Discord) leveren echte provider-adressen, dus de check raakt vooral
 * e-mail+wachtwoord-registraties.
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info", "guerrillamailblock.com",
  "grr.la", "sharklasers.com", "spam4.me", "pokemail.net", "10minutemail.com",
  "10minutemail.net", "tempmail.com", "temp-mail.org", "tempmailo.com", "tempr.email",
  "throwawaymail.com", "yopmail.com", "yopmail.fr", "trashmail.com", "trashmail.de",
  "getnada.com", "nada.email", "dispostable.com", "mailnesia.com", "maildrop.cc",
  "mohmal.com", "fakeinbox.com", "fakemail.net", "mailcatch.com", "tempinbox.com",
  "emailondeck.com", "mintemail.com", "moakt.com", "tmail.ws", "tmpmail.org",
  "tmpmail.net", "33mail.com", "spambog.com", "spambox.us", "discard.email",
  "discardmail.com", "mailtemp.net", "burnermail.io", "anonbox.net", "mytemp.email",
  "mailsac.com", "inboxbear.com", "luxusmail.org", "vomoto.com", "1secmail.com",
  "1secmail.org", "1secmail.net", "wegwerpemail.nl", "wegwerpmailadres.nl",
]);

/** True als het e-mailadres een bekend wegwerp-/tijdelijk domein gebruikt. */
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}
