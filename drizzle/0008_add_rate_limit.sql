-- better-auth rate-limit-tellers (storage: "database"). Additief + idempotent.
CREATE TABLE IF NOT EXISTS "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text,
	"count" integer,
	"last_request" bigint
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_key_idx" ON "rate_limit" USING btree ("key");
