DROP INDEX "idx_projects_org_slug";--> statement-breakpoint
DROP INDEX "idx_environments_project_slug";--> statement-breakpoint
DROP INDEX "idx_flags_project_key";--> statement-breakpoint
DROP INDEX "idx_variations_flag_key";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_projects_org_slug" ON "projects" USING btree ("organization_id","slug") WHERE "projects"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_environments_project_slug" ON "environments" USING btree ("project_id","slug") WHERE "environments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_flags_project_key" ON "feature_flags" USING btree ("project_id","key") WHERE "feature_flags"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_variations_flag_key" ON "variations" USING btree ("feature_flag_id","key") WHERE "variations"."deleted_at" IS NULL;