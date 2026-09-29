-- Estrutura da fila de atendimento por gira.
CREATE TABLE "gira_attendance" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "qrToken" TEXT NOT NULL,
  "queueNumber" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'confirmed',
  "confirmedAt" TEXT NOT NULL,
  "checkedInAt" TEXT,
  "calledAt" TEXT,
  "serviceStartedAt" TEXT,
  "attendedAt" TEXT,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "gira_attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gira_attendance_qrToken_key" ON "gira_attendance"("qrToken");
CREATE UNIQUE INDEX "gira_attendance_eventId_userId_key" ON "gira_attendance"("eventId", "userId");
CREATE UNIQUE INDEX "gira_attendance_eventId_queueNumber_key" ON "gira_attendance"("eventId", "queueNumber");
CREATE INDEX "gira_attendance_eventId_idx" ON "gira_attendance"("eventId");
CREATE INDEX "gira_attendance_userId_idx" ON "gira_attendance"("userId");
CREATE INDEX "gira_attendance_status_idx" ON "gira_attendance"("status");

ALTER TABLE "gira_attendance"
  ADD CONSTRAINT "gira_attendance_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gira_attendance"
  ADD CONSTRAINT "gira_attendance_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
