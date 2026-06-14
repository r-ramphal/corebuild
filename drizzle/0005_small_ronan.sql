CREATE TABLE "price_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"url" text NOT NULL,
	"retailer" text NOT NULL,
	"image_url" text,
	"target_cents" integer NOT NULL,
	"price_at_add_cents" integer NOT NULL,
	"last_notified_cents" integer,
	"last_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "price_alerts_user_idx" ON "price_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "price_alerts_user_product_idx" ON "price_alerts" USING btree ("user_id","product_id");