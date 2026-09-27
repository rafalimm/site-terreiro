ALTER TABLE "users" ADD COLUMN "cpfCnpj" TEXT;
ALTER TABLE "memberships" ADD COLUMN "asaasCustomerId" TEXT;
ALTER TABLE "payment_config" ADD COLUMN "asaasEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "payment_config" ADD COLUMN "asaasEnvironment" TEXT NOT NULL DEFAULT 'sandbox';
ALTER TABLE "payment_config" ADD COLUMN "asaasWebhookId" TEXT;
CREATE TABLE "asaas_webhook_events" (
  "id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "receivedAt" TEXT NOT NULL,
  "processedAt" TEXT,
  CONSTRAINT "asaas_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "asaas_webhook_events_event_idx" ON "asaas_webhook_events"("event");