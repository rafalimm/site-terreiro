ALTER TABLE "entities" ADD COLUMN "ownerId" TEXT;
CREATE INDEX "entities_ownerId_idx" ON "entities"("ownerId");
ALTER TABLE "entities" ADD CONSTRAINT "entities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
