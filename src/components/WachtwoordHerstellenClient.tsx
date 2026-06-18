"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";

export function WachtwoordHerstellenClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const invalidToken = !token || urlError === "INVALID_TOKEN";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("Wachtwoord moet minimaal 12 tekens zijn.");
      return;
    }
    if (password !== confirm) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);
    const result = await resetPassword({ newPassword: password, token: token! });
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Resetten mislukt. Vraag een nieuwe link aan.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/inloggen"), 2000);
  }

  return (
    <main className="pt-16 min-h-screen flex items-center justify-center px-4 sm:px-8">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 sm:p-8 shadow-sm">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Nieuw wachtwoord
          </h1>

          {invalidToken ? (
            <>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
                Deze resetlink is ongeldig of verlopen. Vraag een nieuwe aan.
              </p>
              <Link
                href="/wachtwoord-vergeten"
                className="block text-center w-full h-12 leading-[3rem] bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity"
              >
                Nieuwe resetlink aanvragen
              </Link>
            </>
          ) : done ? (
            <p className="font-body-sm text-body-sm text-success-emerald bg-success-emerald/10 border border-success-emerald/30 rounded-lg px-4 py-3">
              Je wachtwoord is aangepast. Je wordt doorgestuurd naar de inlogpagina.
            </p>
          ) : (
            <>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
                Kies een nieuw wachtwoord van minimaal 12 tekens.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider block mb-2">
                    Nieuw wachtwoord
                  </label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimaal 12 tekens"
                    className="w-full h-11 px-4 bg-white border border-outline-variant rounded-lg font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-label-technical text-label-technical text-on-surface-variant uppercase tracking-wider block mb-2">
                    Herhaal wachtwoord
                  </label>
                  <input
                    type="password"
                    required
                    minLength={12}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Nogmaals je nieuwe wachtwoord"
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
                  {loading ? "Bezig..." : "Wachtwoord opslaan"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
