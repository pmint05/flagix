ALTER TABLE "environments" ADD COLUMN "type" varchar(50) DEFAULT 'development' NOT NULL;
ALTER TABLE "environments" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
