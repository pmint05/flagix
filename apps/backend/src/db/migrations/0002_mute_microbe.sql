CREATE TABLE "flag_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"feature_flag_id" uuid NOT NULL,
	"environment_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" varchar(255),
	"updated_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "feature_flags" RENAME COLUMN "environment_id" TO "project_id";--> statement-breakpoint
ALTER TABLE "feature_flags" DROP CONSTRAINT "feature_flags_environment_id_environments_id_fk";
--> statement-breakpoint
DROP INDEX "idx_flags_env_key";--> statement-breakpoint
DROP INDEX "idx_flags_org_env";--> statement-breakpoint
DROP INDEX "idx_flags_environment";--> statement-breakpoint
DROP INDEX "idx_flags_status";--> statement-breakpoint
DROP INDEX "idx_rules_flag_priority";--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD COLUMN "environment_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "flag_states" ADD CONSTRAINT "flag_states_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flag_states" ADD CONSTRAINT "flag_states_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flag_states" ADD CONSTRAINT "flag_states_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_flag_states_flag_env" ON "flag_states" USING btree ("feature_flag_id","environment_id");--> statement-breakpoint
CREATE INDEX "idx_flag_states_env" ON "flag_states" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "idx_flag_states_org" ON "flag_states" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "environments" ADD CONSTRAINT "environments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD CONSTRAINT "targeting_rules_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_environments_org" ON "environments" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_flags_project_key" ON "feature_flags" USING btree ("project_id","key");--> statement-breakpoint
CREATE INDEX "idx_flags_org" ON "feature_flags" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_flags_project" ON "feature_flags" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rules_flag_env_priority" ON "targeting_rules" USING btree ("feature_flag_id","environment_id","priority");--> statement-breakpoint
CREATE INDEX "idx_rules_env" ON "targeting_rules" USING btree ("environment_id");--> statement-breakpoint
ALTER TABLE "feature_flags" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "feature_flags" DROP COLUMN "is_enabled";