CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"retailer" text NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"url" text NOT NULL,
	"image_url" text,
	"in_stock" boolean DEFAULT true NOT NULL,
	"mock" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'scraper' NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "listings_query_retailer_idx" ON "listings" USING btree ("query","retailer");--> statement-breakpoint
CREATE INDEX "listings_scraped_at_idx" ON "listings" USING btree ("scraped_at");