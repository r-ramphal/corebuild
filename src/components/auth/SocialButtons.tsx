"use client";

/**
 * Social-login-knoppen. Welke knoppen tonen wordt bepaald door
 * NEXT_PUBLIC_SOCIAL_PROVIDERS (komma-lijst, bv. "google,microsoft,discord").
 * Server-side moet de bijbehorende provider geconfigureerd zijn (zie auth.ts).
 * OAuth verloopt via redirect; captcha geldt hier niet (alleen e-mail-routes).
 */
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

type Provider = "google" | "microsoft" | "discord";

const LABELS: Record<Provider, string> = {
  google: "Google",
  microsoft: "Microsoft",
  discord: "Discord",
};

const ENABLED = (process.env.NEXT_PUBLIC_SOCIAL_PROVIDERS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter((s): s is Provider => s in LABELS);

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
      </svg>
    );
  }
  if (provider === "microsoft") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#5865F2" aria-hidden>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

export function SocialButtons({ callbackURL = "/builds" }: { callbackURL?: string }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  if (ENABLED.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {ENABLED.map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy(provider);
            await signIn.social({ provider, callbackURL, errorCallbackURL: "/inloggen" });
            setBusy(null); // bij een redirect bereiken we dit niet; bij falen wel
          }}
          className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-outline-variant rounded-lg font-label-technical text-label-technical text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          <ProviderIcon provider={provider} />
          {busy === provider ? "Bezig…" : `Doorgaan met ${LABELS[provider]}`}
        </button>
      ))}
    </div>
  );
}
