ALTER TABLE "sdk_keys" ADD COLUMN "last_used_at" timestamp;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD COLUMN "is_client_visible" boolean DEFAULT false NOT NULL;