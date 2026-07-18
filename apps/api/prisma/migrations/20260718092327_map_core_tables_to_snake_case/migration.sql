-- Drop old foreign keys before changing column types.
ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_userId_fkey";
ALTER TABLE "ExpensePayment" DROP CONSTRAINT IF EXISTS "ExpensePayment_expenseId_fkey";
ALTER TABLE "ExpensePayment" DROP CONSTRAINT IF EXISTS "ExpensePayment_userId_fkey";
ALTER TABLE "UserSettings" DROP CONSTRAINT IF EXISTS "UserSettings_userId_fkey";

-- Rename enum value safely.
ALTER TYPE "Importance" RENAME VALUE 'cancelSoon' TO 'cancel_soon';

-- Convert ids and foreign keys from text to uuid.
ALTER TABLE "Profile" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;

ALTER TABLE "Expense" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "Expense" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

ALTER TABLE "ExpensePayment" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "ExpensePayment" ALTER COLUMN "expenseId" TYPE UUID USING "expenseId"::uuid;
ALTER TABLE "ExpensePayment" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

ALTER TABLE "UserSettings" ALTER COLUMN "id" TYPE UUID USING "id"::uuid;
ALTER TABLE "UserSettings" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

-- HealthCheck column rename.
ALTER TABLE "HealthCheck" RENAME COLUMN "createdAt" TO "created_at";

-- Rename tables.
ALTER TABLE "Profile" RENAME TO "profiles";
ALTER TABLE "Expense" RENAME TO "expenses";
ALTER TABLE "ExpensePayment" RENAME TO "expense_payments";
ALTER TABLE "UserSettings" RENAME TO "user_settings";

-- Rename columns.
ALTER TABLE "profiles" RENAME COLUMN "displayName" TO "display_name";
ALTER TABLE "profiles" RENAME COLUMN "avatarUrl" TO "avatar_url";
ALTER TABLE "profiles" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "profiles" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "expenses" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "expenses" RENAME COLUMN "defaultAmount" TO "default_amount";
ALTER TABLE "expenses" RENAME COLUMN "billingPeriod" TO "billing_period";
ALTER TABLE "expenses" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "expenses" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "expenses" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "expense_payments" RENAME COLUMN "expenseId" TO "expense_id";
ALTER TABLE "expense_payments" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "expense_payments" RENAME COLUMN "periodMonth" TO "period_month";
ALTER TABLE "expense_payments" RENAME COLUMN "periodYear" TO "period_year";
ALTER TABLE "expense_payments" RENAME COLUMN "paidAt" TO "paid_at";
ALTER TABLE "expense_payments" RENAME COLUMN "amountSnapshot" TO "amount_snapshot";

ALTER TABLE "user_settings" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "user_settings" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "user_settings" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename primary key constraints.
ALTER TABLE "profiles" RENAME CONSTRAINT "Profile_pkey" TO "profiles_pkey";
ALTER TABLE "expenses" RENAME CONSTRAINT "Expense_pkey" TO "expenses_pkey";
ALTER TABLE "expense_payments" RENAME CONSTRAINT "ExpensePayment_pkey" TO "expense_payments_pkey";
ALTER TABLE "user_settings" RENAME CONSTRAINT "UserSettings_pkey" TO "user_settings_pkey";

-- Rename indexes.
ALTER INDEX IF EXISTS "Expense_userId_idx" RENAME TO "expenses_user_id_idx";
ALTER INDEX IF EXISTS "ExpensePayment_userId_periodYear_periodMonth_idx" RENAME TO "expense_payments_user_id_period_year_period_month_idx";
ALTER INDEX IF EXISTS "ExpensePayment_expenseId_periodMonth_periodYear_key" RENAME TO "expense_payments_expense_id_period_month_period_year_key";
ALTER INDEX IF EXISTS "UserSettings_userId_key" RENAME TO "user_settings_user_id_key";

-- Recreate foreign keys with final names.
ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expense_payments"
ADD CONSTRAINT "expense_payments_expense_id_fkey"
FOREIGN KEY ("expense_id") REFERENCES "expenses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expense_payments"
ADD CONSTRAINT "expense_payments_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_settings"
ADD CONSTRAINT "user_settings_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;