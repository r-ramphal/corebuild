/**
 * Gedeeld wachtwoordbeleid — gebruikt door zowel de client (live checklist op de
 * formulieren) als de server (afdwinging in de auth-hook). Eén bron van waarheid
 * zodat wat de gebruiker ziet exact is wat afgedwongen wordt.
 *
 * De minimale lengte (12) spiegelt `minPasswordLength` in `src/lib/auth.ts`.
 * De HIBP-breachcheck (better-auth `haveIBeenPwned`-plugin) staat hier los van:
 * die kan client-side niet voorspeld worden en blijft een serverside vangnet.
 */
export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: `Minimaal ${PASSWORD_MIN_LENGTH} tekens`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: "upper", label: "Een hoofdletter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Een kleine letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "digit", label: "Een cijfer (0-9)", test: (p) => /[0-9]/.test(p) },
  { id: "symbol", label: "Een symbool (!?@#...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/** Labels van de eisen waar het wachtwoord (nog) niet aan voldoet. */
export function failingPasswordRules(password: string): string[] {
  return PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label);
}

/** True wanneer het wachtwoord aan álle eisen voldoet. */
export function passwordMeetsPolicy(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}
