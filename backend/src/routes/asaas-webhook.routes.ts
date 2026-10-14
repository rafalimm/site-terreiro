import { Router } from 'express';
import { timingSafeEqual } from 'crypto';
import { prisma } from '../lib/prisma';
import { asaasWebhookToken } from '../services/asaas';

const router = Router();

function tokenMatches(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  if (receivedBuffer.length === 0 || receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

router.post('/webhooks/asaas', async (req, res) => {
  const expected = asaasWebhookToken();
  const received = String(req.header('asaas-access-token') || '');
  if (!expected || !tokenMatches(received, expected)) {
    return res.status(401).json({ error: 'Webhook não autorizado.' });
  }

  const body = req.body ?? {};
  const eventId = typeof body.id === 'string' ? body.id.slice(0, 200) : '';
  const event = typeof body.event === 'string' ? body.event.slice(0, 120) : '';
  const paymentId = typeof body.payment?.id === 'string' ? body.payment.id.slice(0, 200) : '';
  if (!eventId) return res.status(400).json({ error: 'Evento sem identificador.' });

  let alreadyProcessed = false;
  try {
    await prisma.asaasWebhookEvent.create({
      data: { id: eventId, event, receivedAt: new Date().toISOString() },
    });
  } catch {
    const previous = await prisma.asaasWebhookEvent.findUnique({
      where: { id: eventId },
      select: { processedAt: true },
    });
    if (!previous) return res.status(500).json({ error: 'Não foi possível registrar o evento.' });
    alreadyProcessed = Boolean(previous.processedAt);
  }
  if (alreadyProcessed) return res.status(200).json({ received: true, duplicate: true });

  try {
    if (paymentId) {
      const local = await prisma.membershipPayment.findFirst({ where: { transactionId: paymentId } });
      if (local) {
        const status = event === 'PAYMENT_RECEIVED'
          ? 'paid'
          : event === 'PAYMENT_OVERDUE'
            ? 'overdue'
            : event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED'
              ? 'canceled'
              : null;
        if (status) {
          await prisma.membershipPayment.update({
            where: { id: local.id },
            data: {
              status,
              paidAt: status === 'paid' ? new Date().toISOString() : local.paidAt,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      }
    }
    await prisma.asaasWebhookEvent.update({
      where: { id: eventId },
      data: { processedAt: new Date().toISOString() },
    });
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook Asaas:', error);
    // O evento já foi persistido; o erro é registrado sem revelar detalhes internos ao provedor.
    return res.status(500).json({ error: 'Não foi possível processar o evento.' });
  }
});

export default router;
