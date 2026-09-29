ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "registrationCompleted" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "preRegisteredAt" TEXT;
ALTER TABLE "users" ADD COLUMN "registrationCompletedAt" TEXT;

CREATE INDEX "users_registrationCompleted_idx" ON "users"("registrationCompleted");
CREATE INDEX "users_preRegisteredAt_idx" ON "users"("preRegisteredAt");
