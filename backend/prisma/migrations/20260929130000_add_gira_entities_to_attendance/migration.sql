ALTER TABLE "events" ADD COLUMN "entityIds" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "gira_attendance" ADD COLUMN "entityId" TEXT;

CREATE INDEX "gira_attendance_entityId_idx" ON "gira_attendance"("entityId");

ALTER TABLE "gira_attendance"
ADD CONSTRAINT "gira_attendance_entityId_fkey"
FOREIGN KEY ("entityId") REFERENCES "entities"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
