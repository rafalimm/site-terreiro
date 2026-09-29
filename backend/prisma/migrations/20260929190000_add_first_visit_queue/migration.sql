ALTER TABLE "events" ADD COLUMN "firstVisitEntityIds" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "gira_attendance" ADD COLUMN "isFirstVisit" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "gira_attendance_isFirstVisit_idx" ON "gira_attendance"("isFirstVisit");