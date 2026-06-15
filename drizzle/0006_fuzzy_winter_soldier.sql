CREATE TABLE "reddit_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"subreddit" text NOT NULL,
	"title" text NOT NULL,
	"permalink" text NOT NULL,
	"url" text,
	"author" text,
	"score" integer DEFAULT 0 NOT NULL,
	"num_comments" integer DEFAULT 0 NOT NULL,
	"flair" text,
	"created_utc" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reddit_posts_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE INDEX "reddit_posts_score_idx" ON "reddit_posts" USING btree ("score");--> statement-breakpoint
CREATE INDEX "reddit_posts_subreddit_idx" ON "reddit_posts" USING btree ("subreddit");