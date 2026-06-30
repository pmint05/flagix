ALTER TABLE "targeting_rules" ALTER COLUMN "variation_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "type" varchar(50) DEFAULT 'development' NOT NULL;--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;