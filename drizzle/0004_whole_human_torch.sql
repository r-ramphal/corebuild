CREATE TABLE "price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"retailer" text NOT NULL,
	"url" text NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"category" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "price_history_url_idx" ON "price_history" USING btree ("url","recorded_at");--> statement-breakpoint
CREATE INDEX "price_history_recorded_at_idx" ON "price_history" USING btree ("recorded_at");