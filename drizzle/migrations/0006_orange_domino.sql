CREATE TYPE "public"."account_category" AS ENUM('cash', 'brokerage', 'retirement', 'real_estate', 'vehicle', 'loan', 'credit_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('liquid', 'non_liquid', 'debt');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"category" "account_category" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net_worth_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"value" integer NOT NULL,
	"snapshot_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "net_worth_snapshots_account_id_snapshot_date_unique" UNIQUE("account_id","snapshot_date")
);
--> statement-breakpoint
ALTER TABLE "net_worth_snapshots" ADD CONSTRAINT "net_worth_snapshots_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;