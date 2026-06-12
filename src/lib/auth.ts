import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
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
  },
  trustedOrigins: [
    "https://www.corebuildnl.com",
    "https://corebuildnl.com",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
