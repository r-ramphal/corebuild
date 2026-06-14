import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import { sendEmail } from "./email";
import { resetPasswordEmail } from "./email-templates";
import * as authSchema from "./db/auth-schema";

const db = getDb();
if (!db) {
  throw new Error("Auth vereist een database — zet DATABASE_URL in .env.local");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
  // Standaard alleen actief in productie — expliciet aanzetten zodat
  // login/registratie ook in previews tegen brute-force beschermd is
  rateLimit: {
    enabled: true,
  },
  trustedOrigins: [
    "https://www.corebuildnl.com",
    "https://corebuildnl.com",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
