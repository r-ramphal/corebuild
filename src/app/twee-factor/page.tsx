"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

/**
 * Tweede stap van het inloggen voor accounts met 2FA. De gebruiker komt hier via
 * `onTwoFactorRedirect` (auth-client) nadat het wachtwoord juist was. We vragen
 * een TOTP-code of, als terugval, een backup-code.
 */
export default function TweeFactorPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const value = code.trim();
    const { error: err } =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code: value, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({ code: value });

    setLoading(false);

    if (err) {
      setError(
        err.message?.trim() ||
          (mode === "totp"
            ? "Onjuiste of verlopen code. Probeer de actuele code uit je app."
            : "Onjuiste backup-code.")
      );
      return;
    }

    router.push("/builds");
    router.refresh();
  }

  return (
    <main className="pt-16 min-h-screen flex items-center justify-center px-4 sm:px-8">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Verificatie</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
            {mode === "totp"
              ? "Voer de 6-cijferige code uit je authenticator-app in om in te loggen."
              : "Voer een van je backup-codes in."}
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <input
              type="text"
              inputMode={mode === "totp" ? "numeric" : "text"}
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) =>
                setCode(mode === "totp" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value)
              }
              placeholder={mode === "totp" ? "123456" : "xxxxx-xxxxx"}
              className="w-full h-12 px-4 bg-white border border-outline-variant rounded-lg font-mono text-[18px] tracking-[0.2em] focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />

            {mode === "totp" && (
              <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant select-none">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Vertrouw dit apparaat 30 dagen (geen code meer nodig)
              </label>
            )}

            {error && (
              <div className="font-body-sm text-body-sm text-error-crimson bg-error-crimson/10 border border-error-crimson/30 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length === 0}
              className="w-full h-12 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? "Bezig..." : "Verifiëren"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => {
                setMode((m) => (m === "totp" ? "backup" : "totp"));
                setCode("");
                setError(null);
              }}
              className="font-body-sm text-body-sm text-primary hover:underline"
            >
              {mode === "totp" ? "Backup-code gebruiken" : "Code uit app gebruiken"}
            </button>
            <Link href="/inloggen" className="font-body-sm text-body-sm text-on-surface-variant hover:underline">
              Terug naar inloggen
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
