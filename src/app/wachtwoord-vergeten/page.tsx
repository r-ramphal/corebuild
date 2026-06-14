"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-client";

export default function WachtwoordVergetenPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Bewust geen onderscheid tussen bestaand/niet-bestaand account: dat zou
    // verklappen welke e-mailadressen geregistreerd zijn.
    await requestPasswordReset({ email, redirectTo: "/wachtwoord-herstellen" }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="pt-16 min-h-screen flex items-center justify-center px-8">
      <div className="w-full max-w-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Wachtwoord vergeten
          </h1>

          {sent ? (
            <>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
                Als er een account bij <span className="text-on-surface font-medium">{email}</span>{" "}
                hoort, sturen we een e-mail met een link om je wachtwoord opnieuw in te stellen.
                Check ook je spam-map.
              </p>
              <Link
                href="/inloggen"
                className="block text-center w-full h-12 leading-[3rem] bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity"
              >
                Terug naar inloggen
              </Link>
            </>
          ) : (
            <>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
                Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord te kiezen.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary text-on-primary rounded-lg font-label-technical text-label-technical hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                >
                  {loading ? "Bezig..." : "Stuur resetlink"}
                </button>
              </form>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-6 text-center">
                <Link href="/inloggen" className="text-primary hover:underline">
                  Terug naar inloggen
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
