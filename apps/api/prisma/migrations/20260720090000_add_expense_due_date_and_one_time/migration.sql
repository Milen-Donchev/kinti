ALTER TYPE "BillingPeriod" ADD VALUE IF NOT EXISTS 'one_time';

ALTER TYPE "Language" ADD VALUE IF NOT EXISTS 'es';

ALTER TABLE "expenses"
ADD COLUMN "due_date" DATE;

UPDATE "expenses"
SET "due_date" = "created_at"::date
WHERE "due_date" IS NULL;

ALTER TABLE "expenses"
ALTER COLUMN "due_date" SET NOT NULL;

CREATE INDEX "expenses_user_id_billing_period_due_date_idx"
ON "expenses"("user_id", "billing_period", "due_date");
