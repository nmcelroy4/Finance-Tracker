CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"goal_amount" integer NOT NULL,
	"current_amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
