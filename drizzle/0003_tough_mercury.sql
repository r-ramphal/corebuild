ALTER TABLE "builds" ADD COLUMN "published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "builds_published_idx" ON "builds" USING btree ("published");