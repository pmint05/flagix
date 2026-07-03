ALTER TABLE "flag_states" ADD COLUMN "off_variation_id" uuid;--> statement-breakpoint
ALTER TABLE "flag_states" ADD COLUMN "default_variation_id" uuid;--> statement-breakpoint
ALTER TABLE "variations" ADD COLUMN "color" varchar(50);--> statement-breakpoint
ALTER TABLE "flag_states" ADD CONSTRAINT "flag_states_off_variation_id_variations_id_fk" FOREIGN KEY ("off_variation_id") REFERENCES "public"."variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flag_states" ADD CONSTRAINT "flag_states_default_variation_id_variations_id_fk" FOREIGN KEY ("default_variation_id") REFERENCES "public"."variations"("id") ON DELETE no action ON UPDATE no action;