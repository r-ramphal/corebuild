ALTER TABLE "listings" ADD COLUMN "category" text;--> statement-breakpoint
CREATE INDEX "listings_category_idx" ON "listings" USING btree ("category");