ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'compras';

CREATE TABLE "purchase_items" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "quantity" TEXT NOT NULL,
  "unit" TEXT,
  "category" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "notes" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdBy" TEXT NOT NULL,
  "purchasedBy" TEXT,
  "purchasedAt" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "purchase_items_status_idx" ON "purchase_items"("status");
CREATE INDEX "purchase_items_priority_idx" ON "purchase_items"("priority");