CREATE TABLE "vaccine_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"vaccine_name" text NOT NULL,
	"vaccine_category" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"taken_date" date,
	"age_milestone" text NOT NULL,
	"sequence_order" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vaccine_records" ADD CONSTRAINT "vaccine_records_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;