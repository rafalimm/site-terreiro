CREATE TABLE "appointments" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "email" TEXT,
  "type" TEXT NOT NULL,
  "preferredDate" TEXT NOT NULL,
  "preferredTime" TEXT NOT NULL,
  "notes" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pendente',
  "createdAt" TEXT NOT NULL,
  CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);
