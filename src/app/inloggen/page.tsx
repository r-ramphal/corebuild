"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signUp, authClient } from "@/lib/auth-client";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Turnstile } from "@/components/auth/Turnstile";

type Mode = "login" | "register";

const CAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const HAS_SOCIAL = (process.env.NEXT_PUBLIC_SOCIAL_PROVIDERS ?? "").trim().length > 0;

export default function InloggenPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const captchaRequired = Boolean(CAPTCHA_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResendMsg(null);
    setLoading(true);

    const fetchOptions = captchaToken
      ? { headers: { "x-captcha-response": captchaToken } }
      : undefined;

    const result =
      mode === "login"
        ? await signIn.email({ email, password }, fetchOptions)
        : await signUp.email(
            { name: name.trim() || email.split("@")[0], email, password },
            fetchOptions
          );

    setLoading(false);

    if (result.error) {
      setError(
        result.error.message ?? (mode === "login" ? "Inloggen mislukt" : "Registreren mislukt")
      );
      // Turnstile-token is eenmalig — vernieuwen voor een nieuwe poging.
      if (captchaRequired) {
        setCaptchaToken(null);
        setCaptchaReset((n) => n + 1);
      }
      return;
    }

    if (mode === "register") {
      // Geen sessie-token terug = e-mailverificatie vereist → bevestigingsscherm.
      // Wél een token = auto-ingelogd (verificatie staat uit) → door naar builds.
      const token = (result.data as { token?: string | null } | null)?.token;
      if (!token) {
        setRegistered(true);
        return;
      }
    }

    router.push("/builds");
    router.refresh();
  }

  async function handleResend() {
    setResendMsg(null);
    const { error: err } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/builds",
    });
    setResendMsg(
      err
        ? "Versturen mislukt — controleer het e-mailadres."
        : "Nieuwe bevestigingsmail verstuurd."
    );
  }

  if (registered) {
    return (
      <main className="pt-16 min-h-screen flex items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 sm:p-8 shadow-sm text-center">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
              Bevestig je e-mailadres
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              We hebben een bevestigingsmail gestuurd naar{" "}
              <span className="text-on-surface font-medium">{email}</span>. Klik op de link in die
              mail om je account te activeren en in te loggen.
            </p>
            <button
              onClick={handleResend}
              className="font-body-sm text-body-sm text-primary hover:underline"
            >
              Geen mail ontvangen? Opnieuw versturen
            </button>
            {resendMsg && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">{resendMsg}</p>
            )}
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-6">
              <button
                onClick={() => {
                  setRegistered(false);
                  setMode("login");
                }}
                className="text-primary hover:underline"
              >
                Terug naar inloggen
              </button>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 min-h-screen flex items-center justify-center px-4 sm:px-8">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 sm:p-8 shadow-sm">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            {mode === "login" ? "Inloggen" : "Account aanmaken"}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
            {mode === "login"
              ? "Log in om je builds op te slaan en te delen."
              : "Maak een gratis account om je builds op te slaan."}
          </p>

          {HAS_SOCIAL && (
            <>
              <SocialButtons callbackURL="/builds" />
              <div className="flex items-center gap-3 my-6" aria-hidden>
                <span className="h-px flex-1 bg-outline-variant" />
                <span className="font-label-technical text-label-technical uppercase tracking-wider text-on-surface-variant">
                  of met e-mail
                </span>
                <span className="h-px flex-1 bg-outline-variant" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <label className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider block mb-2">
                  Naam
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Je naam"
                  className="w-full h-11 px-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            )}

            <div>
              <label className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider block mb-2">
                E-mailadres
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl"
                className="w-full h-11 px-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider block mb-2">
                Wachtwoord
              </label>
              <input
                type="password"
                required
                minLength={mode === "register" ? 12 : 8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimaal 12 tekens" : "Je wachtwoord"}
                className="w-full h-11 px-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            {mode === "login" && (
              <div className="-mt-1 text-right">
                <Link
                  href="/wachtwoord-vergeten"
                  className="font-body-sm text-body-sm text-primary hover:underline"
                >
                  Wachtwoord vergeten?
                </Link>
              </div>
            )}

            {CAPTCHA_SITE_KEY && (
              <Turnstile
                siteKey={CAPTCHA_SITE_KEY}
                onToken={setCaptchaToken}
                resetSignal={captchaReset}
              />
            )}

            {error && (
              <div className="font-body-sm text-body-sm text-error-crimson bg-error-crimson/10 border border-error-crimson/30 rounded-lg px-4 py-3">
                <p>{error}</p>
                {mode === "login" && email && (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="mt-1 text-primary hover:underline"
                  >
                    Bevestigingsmail opnieuw versturen
                  </button>
                )}
              </div>
            )}

            {resendMsg && mode === "login" && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">{resendMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading || (captchaRequired && !captchaToken)}
              className="w-full h-12 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? "Bezig..." : mode === "login" ? "Inloggen" : "Account aanmaken"}
            </button>
          </form>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-6 text-center">
            {mode === "login" ? (
              <>
                Nog geen account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="text-primary hover:underline"
                >
                  Registreren
                </button>
              </>
            ) : (
              <>
                Al een account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-primary hover:underline"
                >
                  Inloggen
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
