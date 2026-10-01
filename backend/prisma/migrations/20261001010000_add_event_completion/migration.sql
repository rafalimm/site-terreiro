ALTER TABLE "events" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "completedAt" TEXT;
