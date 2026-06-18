"use client";

import { PASSWORD_RULES } from "@/lib/password-policy";

/**
 * Live checklist van de wachtwoordeisen: elk vinkje kleurt groen zodra de regel
 * gehaald is. Toont de gebruiker vooraf wat een geldig wachtwoord is i.p.v. pas
 * een foutmelding ná het indienen.
 */
export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1.5 mt-1" aria-label="Wachtwoordeisen">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.id} className="flex items-center gap-2 font-body-sm text-body-sm">
            <span
              aria-hidden
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none ${
                ok
                  ? "bg-success-emerald/15 text-success-emerald"
                  : "bg-outline-variant/40 text-on-surface-variant"
              }`}
            >
              {ok ? "✓" : ""}
            </span>
            <span className={ok ? "text-on-surface" : "text-on-surface-variant"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
