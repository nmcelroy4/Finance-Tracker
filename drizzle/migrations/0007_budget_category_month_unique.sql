-- Keep the most recently created budget when historic data contains duplicates.
-- The application treats a later submission for the same category and month as
-- a replacement, so older duplicate values are superseded.
DELETE FROM "budget" older
USING "budget" newer
WHERE older."category_id" = newer."category_id"
  AND older."month_year" = newer."month_year"
  AND older."id" < newer."id";
--> statement-breakpoint
ALTER TABLE "budget"
ADD CONSTRAINT "budget_category_month_unique"
UNIQUE("category_id", "month_year");
