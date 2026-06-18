import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { captcha, haveIBeenPwned, twoFactor } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { getDb } from "./db";
import { sendEmail } from "./email";
import { resetPasswordEmail, verifyEmail } from "./email-templates";
import { isDisposableEmail } from "./disposable-email";
import { failingPasswordRules } from "./password-policy";
import * as authSchema from "./db/auth-schema";

const db = getDb();
if (!db) {
  throw new Error("Auth vereist een database — zet DATABASE_URL in .env.local");
}

// E-mailverificatie kan alleen verplicht zijn als er ook echt mail verstuurd kan
// worden. Zonder RESEND_API_KEY zou "verplicht" elke registratie blokkeren (niemand
// kan dan bevestigen). Dus: verificatie schakelt automatisch aan zodra Resend is
// geconfigureerd; tot die tijd blijven captcha + wegwerp-mailblokkade + social de
// spambescherming.
const emailConfigured = Boolean(process.env.RESEND_API_KEY);

/**
 * Social providers — alleen aanzetten als de credentials aanwezig zijn. Zo
 * breekt de build niet zonder keys en verschijnt een provider pas zodra hij
 * geconfigureerd is. Vereiste env-vars per provider:
 *   Google    : GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
 *   Microsoft : MICROSOFT_CLIENT_ID + MICROSOFT_CLIENT_SECRET (+ MICROSOFT_TENANT_ID, default "common")
 *   Discord   : DISCORD_CLIENT_ID + DISCORD_CLIENT_SECRET
 * Spiegel dit in NEXT_PUBLIC_SOCIAL_PROVIDERS zodat de juiste knoppen tonen.
 */
const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  socialProviders.microsoft = {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID || "common",
  };
}
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  socialProviders.discord = {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  };
}

/**
 * CAPTCHA (Cloudflare Turnstile) — beschermt registratie + login tegen bots.
 * Alleen actief met een secret. Beschermt bewust níét /request-password-reset
 * (die pagina heeft geen widget en is al rate-limited). De client stuurt de
 * token mee via de header `x-captcha-response`.
 */
// 2FA (TOTP) staat altijd aan: gebruikers kunnen het zelf inschakelen (opt-in).
// `issuer` is de naam die in de authenticator-app verschijnt. Captcha blijft
// env-gated — alleen actief met een Turnstile-secret.
const plugins: BetterAuthOptions["plugins"] = [
  twoFactor({ issuer: "CoreBuild" }),
  // Weiger wachtwoorden die in een bekend datalek voorkomen. HIBP-k-anonymity:
  // alleen de eerste 5 tekens van de SHA-1-hash gaan naar de API, het wachtwoord
  // zelf verlaat de server nooit. Dekt sign-up, wachtwoord-reset en -wijziging.
  haveIBeenPwned({
    customPasswordCompromisedMessage:
      "Dit wachtwoord komt voor in een bekend datalek. Kies een ander, uniek wachtwoord.",
  }),
];
if (process.env.TURNSTILE_SECRET_KEY) {
  plugins.push(
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: process.env.TURNSTILE_SECRET_KEY,
      endpoints: ["/sign-up/email", "/sign-in/email"],
    })
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    // Account moet eerst de e-mail bevestigen vóór inloggen — grootste rem op
    // spam-/nepaccounts. Alleen actief als Resend geconfigureerd is (zie boven).
    requireEmailVerification: emailConfigured,
    // Wachtwoord-reset: better-auth genereert de token + link, wij mailen 'm.
    // Zonder RESEND_API_KEY no-opt sendEmail (de flow blijft werken, alleen
    // zonder daadwerkelijke verzending).
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Stel je CoreBuild-wachtwoord opnieuw in",
        html: resetPasswordEmail(url),
        text: `Stel je wachtwoord opnieuw in via deze link (1 uur geldig): ${url}`,
      });
    },
  },
  // Verificatiemail bij registratie; na bevestigen meteen ingelogd.
  emailVerification: {
    sendOnSignUp: emailConfigured,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const sent = await sendEmail({
        to: user.email,
        subject: "Bevestig je CoreBuild-account",
        html: verifyEmail(url),
        text: `Bevestig je e-mailadres via deze link: ${url}`,
      });
      // Dev-vangnet: zonder RESEND_API_KEY wordt er niets verstuurd — log dan de
      // verificatielink zodat je lokaal toch kunt bevestigen. Nooit in productie.
      if (!sent && process.env.NODE_ENV !== "production") {
        console.log(`[auth] Verificatielink (dev) voor ${user.email}: ${url}`);
      }
    },
  },
  socialProviders,
  // Wegwerp-e-maildomeinen weigeren bij het aanmaken van een account.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (isDisposableEmail(user.email)) {
            throw new APIError("BAD_REQUEST", {
              message:
                "Wegwerp-e-mailadressen zijn niet toegestaan. Gebruik een vast e-mailadres.",
            });
          }
        },
      },
    },
  },
  // Wachtwoordbeleid serverside afdwingen op elke plek waar een wachtwoord
  // gezet wordt — zodat een omzeilde client-validatie alsnog geweigerd wordt.
  // (Lengte dekt better-auth's minPasswordLength al af; hier de samenstelling.)
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const passwordField: Record<string, "password" | "newPassword"> = {
        "/sign-up/email": "password",
        "/reset-password": "newPassword",
        "/change-password": "newPassword",
      };
      const field = passwordField[ctx.path];
      if (!field) return;
      const body = ctx.body as Record<string, unknown> | undefined;
      const password = body?.[field];
      if (typeof password !== "string") return;
      const failing = failingPasswordRules(password);
      if (failing.length > 0) {
        throw new APIError("BAD_REQUEST", {
          message: `Wachtwoord voldoet niet aan de eisen (${failing.join(", ")}).`,
        });
      }
    }),
  },
  // Brute-force/credential-stuffing-bescherming. Expliciet aan (ook in previews).
  rateLimit: {
    enabled: true,
    // Tellers in Postgres → gedeeld over álle serverless-instances. In-memory
    // (de default) reset per lambda-instance, waardoor de limiet op Vercel
    // nauwelijks knijpt; database-storage maakt 'm betrouwbaar.
    storage: "database",
    // Strakke limiet op de gevoelige auth-endpoints (per IP). De globale default
    // (100/10s) blijft voor de rest; de 2FA-verify-endpoints hebben hun eigen
    // plugin-limiet.
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      // /get-session wordt bij elke sessiecheck aangeroepen (useSession) en is
      // geen brute-force-doel (ongeldig token → null, geen mutatie). Uitsluiten
      // zodat DB-storage niet bij elke sessiecheck de rate_limit-tabel raakt.
      "/get-session": false,
    },
  },
  plugins,
  trustedOrigins: [
    "https://www.corebuildnl.com",
    "https://corebuildnl.com",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
