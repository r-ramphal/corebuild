"use client";

/**
 * Cloudflare Turnstile-widget (CAPTCHA). Laadt het script één keer, rendert de
 * widget expliciet en geeft de token terug via onToken. De server (better-auth
 * captcha-plugin) verifieert de token op /sign-up/email en /sign-in/email; de
 * client stuurt 'm mee in de header `x-captcha-response`.
 *
 * Alleen renderen als NEXT_PUBLIC_TURNSTILE_SITE_KEY gezet is.
 */
import { useEffect, useRef } from "react";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface Props {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Bump om de widget te resetten (token is eenmalig — na een poging vernieuwen). */
  resetSignal?: number;
  theme?: "light" | "dark" | "auto";
}

export function Turnstile({ siteKey, onToken, resetSignal = 0, theme = "light" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  // In een ref zodat een nieuwe onToken-functie de widget niet herrendert.
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;

    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (window.turnstile) return resolve();
        const base = SCRIPT_SRC.split("?")[0];
        const existing = document.querySelector<HTMLScriptElement>(`script[src^="${base}"]`);
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          if (window.turnstile) resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        s.addEventListener("load", () => resolve(), { once: true });
        document.head.appendChild(s);
      });

    void ensureScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme,
        callback: (token) => cb.current(token),
        "expired-callback": () => cb.current(null),
        "error-callback": () => cb.current(null),
      });
    });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* widget al weg */
        }
        widgetId.current = null;
      }
    };
  }, [siteKey, theme]);

  // Reset op signaal (na een mislukte/gebruikte poging).
  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      cb.current(null);
    }
  }, [resetSignal]);

  return <div ref={ref} className="min-h-[65px]" />;
}
