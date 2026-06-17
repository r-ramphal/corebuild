import { pgTable, text, boolean, timestamp, index, integer, bigint } from "drizzle-orm/pg-core";

/** Standaard better-auth tabellen (e-mail + wachtwoord). */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** 2FA (TOTP) ingeschakeld — gezet door de better-auth twoFactor-plugin. */
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

/**
 * 2FA (TOTP) — better-auth twoFactor-plugin. Eén rij per gebruiker met 2FA aan:
 * het TOTP-`secret` + de `backupCodes` (door better-auth versleuteld/gehasht
 * opgeslagen, nooit teruggegeven aan de client). `verified` wordt true zodra de
 * gebruiker de eerste code heeft bevestigd. De export moet `twoFactor` heten —
 * dat is de model-naam die de drizzle-adapter van de plugin verwacht.
 */
export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verified: boolean("verified").notNull().default(true),
  },
  (table) => [
    index("two_factor_user_id_idx").on(table.userId),
    index("two_factor_secret_idx").on(table.secret),
  ]
);

/**
 * Rate-limit-tellers voor better-auth (storage: "database"). Hiermee deelt
 * better-auth de tellers via Postgres i.p.v. per-instance geheugen — cruciaal op
 * serverless, waar elke lambda anders zijn eigen (telkens resetbare) teller heeft
 * en brute-force amper geremd wordt. Eén rij per (endpoint+IP)-sleutel; better-auth
 * beheert deze tabel zelf. De export moet `rateLimit` heten (model-naam van de adapter).
 */
export const rateLimit = pgTable(
  "rate_limit",
  {
    id: text("id").primaryKey(),
    key: text("key"),
    count: integer("count"),
    lastRequest: bigint("last_request", { mode: "number" }),
  },
  (table) => [index("rate_limit_key_idx").on(table.key)]
);
