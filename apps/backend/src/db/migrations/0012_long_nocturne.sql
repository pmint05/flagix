CREATE TABLE "evaluation_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "evaluation_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"environment_id" uuid NOT NULL,
	"feature_flag_id" uuid,
	"flag_key" text NOT NULL,
	"variation_id" uuid,
	"variation_key" text,
	"resolved_value" jsonb,
	"evaluation_reason" text NOT NULL,
	"context_user_hash" text,
	"sdk_key_id" uuid,
	"client_ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_stats_daily" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "evaluation_stats_daily_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"feature_flag_id" uuid,
	"environment_id" uuid,
	"evaluation_reason" text,
	"unique_users" bigint DEFAULT 0 NOT NULL,
	"total_count" bigint DEFAULT 0 NOT NULL,
	"bucket" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_stats_hourly" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "evaluation_stats_hourly_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"organization_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"environment_id" uuid NOT NULL,
	"feature_flag_id" uuid NOT NULL,
	"variation_id" uuid,
	"evaluation_reason" text NOT NULL,
	"unique_users" bigint DEFAULT 0 NOT NULL,
	"total_count" bigint DEFAULT 0 NOT NULL,
	"bucket" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluation_events" ADD CONSTRAINT "evaluation_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_events" ADD CONSTRAINT "evaluation_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_events" ADD CONSTRAINT "evaluation_events_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_events" ADD CONSTRAINT "evaluation_events_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_events" ADD CONSTRAINT "evaluation_events_variation_id_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_events" ADD CONSTRAINT "evaluation_events_sdk_key_id_sdk_keys_id_fk" FOREIGN KEY ("sdk_key_id") REFERENCES "public"."sdk_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_stats_daily" ADD CONSTRAINT "evaluation_stats_daily_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_stats_daily" ADD CONSTRAINT "evaluation_stats_daily_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_stats_daily" ADD CONSTRAINT "evaluation_stats_daily_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_stats_hourly" ADD CONSTRAINT "evaluation_stats_hourly_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_stats_hourly" ADD CONSTRAINT "evaluation_stats_hourly_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_stats_hourly" ADD CONSTRAINT "evaluation_stats_hourly_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_stats_hourly" ADD CONSTRAINT "evaluation_stats_hourly_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_stats_hourly" ADD CONSTRAINT "evaluation_stats_hourly_variation_id_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_eval_events_org_time" ON "evaluation_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_eval_events_env_flag_time" ON "evaluation_events" USING btree ("environment_id","flag_key","created_at");--> statement-breakpoint
CREATE INDEX "idx_eval_events_flag_time" ON "evaluation_events" USING btree ("feature_flag_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_eval_events_created_at" ON "evaluation_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_stats_daily_unique" ON "evaluation_stats_daily" USING btree ("organization_id","feature_flag_id","environment_id","evaluation_reason","bucket");--> statement-breakpoint
CREATE INDEX "idx_stats_daily_flag_bucket" ON "evaluation_stats_daily" USING btree ("feature_flag_id","bucket");--> statement-breakpoint
CREATE INDEX "idx_stats_daily_org_bucket" ON "evaluation_stats_daily" USING btree ("organization_id","bucket");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_stats_hourly_unique" ON "evaluation_stats_hourly" USING btree ("organization_id","feature_flag_id","environment_id","variation_id","evaluation_reason","bucket");--> statement-breakpoint
CREATE INDEX "idx_stats_hourly_flag_bucket" ON "evaluation_stats_hourly" USING btree ("feature_flag_id","bucket");--> statement-breakpoint
CREATE INDEX "idx_stats_hourly_org_bucket" ON "evaluation_stats_hourly" USING btree ("organization_id","bucket");--> statement-breakpoint
CREATE INDEX "idx_stats_hourly_env_bucket" ON "evaluation_stats_hourly" USING btree ("environment_id","bucket");