CREATE INDEX IF NOT EXISTS "expenses_user_id_is_active_due_date_idx"
ON "expenses"("user_id", "is_active", "due_date");

CREATE INDEX IF NOT EXISTS "expenses_user_id_is_active_created_at_idx"
ON "expenses"("user_id", "is_active", "created_at");

CREATE INDEX IF NOT EXISTS "expense_payments_user_period_paid_at_idx"
ON "expense_payments"("user_id", "period_year", "period_month", "paid_at");

CREATE INDEX IF NOT EXISTS "expense_payments_user_expense_period_paid_at_idx"
ON "expense_payments"("user_id", "expense_id", "period_year", "period_month", "paid_at");
