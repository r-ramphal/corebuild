ALTER TABLE "builds" ADD COLUMN "alert_target_cents" integer;--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "alert_last_notified_cents" integer;--> statement-breakpoint
ALTER TABLE "builds" ADD COLUMN "alert_last_notified_at" timestamp with time zone;