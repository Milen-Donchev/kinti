-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('monthly', 'yearly');

-- CreateEnum
CREATE TYPE "Importance" AS ENUM ('essential', 'useful', 'cancelSoon');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('subscription', 'utility');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('light', 'dark', 'system');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('bg', 'en');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('eur', 'usd', 'gbp');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultAmount" DECIMAL(10,2) NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "importance" "Importance" NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpensePayment" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountSnapshot" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ExpensePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" "Theme" NOT NULL DEFAULT 'system',
    "language" "Language" NOT NULL DEFAULT 'bg',
    "currency" "Currency" NOT NULL DEFAULT 'eur',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");

-- CreateIndex
CREATE INDEX "ExpensePayment_userId_periodYear_periodMonth_idx" ON "ExpensePayment"("userId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "ExpensePayment_expenseId_periodMonth_periodYear_key" ON "ExpensePayment"("expenseId", "periodMonth", "periodYear");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
