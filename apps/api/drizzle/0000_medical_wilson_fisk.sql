CREATE TYPE "public"."operator" AS ENUM('equals', 'not_equals', 'contains', 'in');--> statement-breakpoint
CREATE TABLE "flag_evaluations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"flag_id" uuid NOT NULL,
	"user_id" text,
	"result" boolean NOT NULL,
	"evaluated_at" timestamp DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"is_client_side" boolean DEFAULT false NOT NULL,
	"default_value" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid,
	"archived_by" uuid
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"publishable_key" text NOT NULL,
	"secret_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "projects_publishable_key_unique" UNIQUE("publishable_key"),
	CONSTRAINT "projects_secret_key_unique" UNIQUE("secret_key")
);
--> statement-breakpoint
CREATE TABLE "targeting_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flag_id" uuid NOT NULL,
	"attribute" text NOT NULL,
	"operator" "operator" NOT NULL,
	"value" jsonb NOT NULL,
	"rollout_percentage" integer DEFAULT 100 NOT NULL,
	"priority" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flag_evaluations" ADD CONSTRAINT "flag_evaluations_flag_id_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."flags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD CONSTRAINT "targeting_rules_flag_id_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."flags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD CONSTRAINT "targeting_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "targeting_rules" ADD CONSTRAINT "targeting_rules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evals_flag_idx" ON "flag_evaluations" USING btree ("flag_id");--> statement-breakpoint
CREATE INDEX "evals_user_idx" ON "flag_evaluations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "evals_time_idx" ON "flag_evaluations" USING btree ("evaluated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "flags_project_key_unique" ON "flags" USING btree ("project_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_pk_idx" ON "projects" USING btree ("publishable_key");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_sk_idx" ON "projects" USING btree ("secret_key");--> statement-breakpoint
CREATE INDEX "tr_flag_idx" ON "targeting_rules" USING btree ("flag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");