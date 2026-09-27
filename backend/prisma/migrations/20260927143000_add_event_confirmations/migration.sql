CREATE TABLE "event_confirmations" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  CONSTRAINT "event_confirmations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_confirmations_eventId_userId_key" ON "event_confirmations"("eventId", "userId");
CREATE INDEX "event_confirmations_eventId_idx" ON "event_confirmations"("eventId");
CREATE INDEX "event_confirmations_userId_idx" ON "event_confirmations"("userId");

ALTER TABLE "event_confirmations"
  ADD CONSTRAINT "event_confirmations_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_confirmations"
  ADD CONSTRAINT "event_confirmations_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
