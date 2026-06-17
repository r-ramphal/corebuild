import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { captcha, twoFactor } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { getDb } from "./db";
import { sendEmail } from "./email";
import { resetPasswordEmail, verifyEmail } from "./email-templates";
import { isDisposableEmail } from "./disposable-email";
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
const plugins: BetterAuthOptions["plugins"] = [twoFactor({ issuer: "CoreBuild" })];
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
    minPasswordLength: 8,
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
  // Standaard alleen actief in productie — expliciet aanzetten zodat
  // login/registratie ook in previews tegen brute-force beschermd is
  rateLimit: {
    enabled: true,
  },
  plugins,
  trustedOrigins: [
    "https://www.corebuildnl.com",
    "https://corebuildnl.com",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
