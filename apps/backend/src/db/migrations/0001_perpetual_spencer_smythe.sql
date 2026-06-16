ALTER TABLE "organizations" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "sdk_keys" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "sdk_keys" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "sdk_keys" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "environment_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "actor_ip" varchar(45);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "request_method" varchar(10);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "request_path" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environments" ADD CONSTRAINT "environments_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environments" ADD CONSTRAINT "environments_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "environments" ADD CONSTRAINT "environments_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sdk_keys" ADD CONSTRAINT "sdk_keys_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sdk_keys" ADD CONSTRAINT "sdk_keys_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sdk_keys" ADD CONSTRAINT "sdk_keys_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD CONSTRAINT "targeting_rules_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD CONSTRAINT "targeting_rules_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD CONSTRAINT "targeting_rules_deleted_by_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_environment_id_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environments"("id") ON DELETE no action ON UPDATE no action;