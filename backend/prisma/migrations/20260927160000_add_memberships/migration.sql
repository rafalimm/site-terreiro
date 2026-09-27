CREATE TABLE "memberships" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "monthlyAmountCents" INTEGER NOT NULL,
  "dueDay" INTEGER NOT NULL DEFAULT 10,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "memberships_userId_key" ON "memberships"("userId");

CREATE TABLE "membership_payments" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "referenceMonth" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "dueDate" TEXT NOT NULL,
  "paidAt" TEXT,
  "method" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "transactionId" TEXT,
  "proofUrl" TEXT,
  "notes" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "membership_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "membership_payments_membershipId_referenceMonth_key" ON "membership_payments"("membershipId", "referenceMonth");
CREATE INDEX "membership_payments_membershipId_idx" ON "membership_payments"("membershipId");
CREATE INDEX "membership_payments_referenceMonth_idx" ON "membership_payments"("referenceMonth");
CREATE INDEX "membership_payments_status_idx" ON "membership_payments"("status");

ALTER TABLE "memberships"
  ADD CONSTRAINT "memberships_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membership_payments"
  ADD CONSTRAINT "membership_payments_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
