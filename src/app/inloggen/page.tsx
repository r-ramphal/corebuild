"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "login" | "register";

export default function InloggenPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === "login"
        ? await signIn.email({ email, password })
        : await signUp.email({ name: name.trim() || email.split("@")[0], email, password });

    setLoading(false);

    if (result.error) {
      setError(
        result.error.message ??
          (mode === "login" ? "Inloggen mislukt" : "Registreren mislukt")
      );
      return;
    }
    router.push("/builds");
    router.refresh();
  }

  return (
    <main className="pt-16 min-h-screen flex items-center justify-center px-8">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            {mode === "login" ? "Inloggen" : "Account aanmaken"}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
            {mode === "login"
              ? "Log in om je builds op te slaan en te delen."
              : "Maak een gratis account om je builds op te slaan."}
          </p>

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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimaal 8 tekens" : "Je wachtwoord"}
                className="w-full h-11 px-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            {error && (
              <p className="font-body-sm text-body-sm text-error-crimson bg-error-crimson/10 border border-error-crimson/30 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading
                ? "Bezig..."
                : mode === "login"
                  ? "Inloggen"
                  : "Account aanmaken"}
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
