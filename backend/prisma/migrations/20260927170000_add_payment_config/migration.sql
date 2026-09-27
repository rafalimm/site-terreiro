CREATE TABLE "payment_config" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "method" TEXT NOT NULL DEFAULT 'pix',
  "receiverName" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "pixKeyType" TEXT,
  "pixKey" TEXT,
  "bankName" TEXT,
  "accountHolder" TEXT,
  "bankDetails" TEXT,
  "instructions" TEXT,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "payment_config_pkey" PRIMARY KEY ("id")
);
