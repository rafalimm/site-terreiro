import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { hasPermission } from '../utils/permissions';

const router = Router();

router.use(authenticate);

// Confirma a presença do usuário na gira. Usuários só podem confirmar
// giras que conseguem visualizar.
router.post('/events/:id/confirmation', async (req, res) => {
  try {
    const event = await prisma.giraEvent.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Gira não encontrada.' });

    const canView = event.isPublic || hasPermission(req.user!.role, 'filho_content') || hasPermission(req.user!.role, 'events');
    if (!canView) return res.status(403).json({ error: 'Você não tem acesso a esta gira.' });

    const now = new Date().toISOString();
    const confirmation = await prisma.eventConfirmation.upsert({
      where: { eventId_userId: { eventId: event.id, userId: req.user!.id } },
      create: {
        eventId: event.id,
        userId: req.user!.id,
        createdAt: now,
      },
      update: {},
    });

    const attendance = await prisma.giraAttendance.upsert({
      where: { eventId_userId: { eventId: event.id, userId: req.user!.id } },
      create: {
        eventId: event.id,
        userId: req.user!.id,
        qrToken: randomUUID(),
        status: 'confirmed',
        confirmedAt: now,
        updatedAt: now,
      },
      update: {},
    });

    res.status(201).json({ confirmed: true, confirmation, attendance });
  } catch (error) {
    console.error('Erro ao confirmar presença:', error);
    res.status(500).json({ error: 'Não foi possível confirmar sua presença.' });
  }
});

router.delete('/events/:id/confirmation', async (req, res) => {
  try {
    const attendance = await prisma.giraAttendance.findUnique({
      where: { eventId_userId: { eventId: req.params.id, userId: req.user!.id } },
    });
    if (attendance && attendance.status !== 'confirmed') {
      return res.status(400).json({ error: 'A presença já entrou no fluxo da fila e não pode mais ser cancelada.' });
    }

    await prisma.eventConfirmation.delete({
      where: { eventId_userId: { eventId: req.params.id, userId: req.user!.id } },
    });
    if (attendance) {
      await prisma.giraAttendance.delete({ where: { id: attendance.id } });
    }
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Confirmação não encontrada.' });
  }
});

router.get('/events/confirmations/mine', async (req, res) => {
  const confirmations = await prisma.eventConfirmation.findMany({
    where: { userId: req.user!.id },
    select: { eventId: true },
  });
  res.json(confirmations.map(item => item.eventId));
});

router.get('/events/confirmations/summary', authorize('events', 'agenda'), async (_req, res) => {
  const confirmations = await prisma.eventConfirmation.findMany({
    select: {
      eventId: true,
      user: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const summary = confirmations.reduce<Record<string, { count: number; users: Array<{ id: string; name: string; role: string }> }>>((acc, item) => {
    if (!acc[item.eventId]) acc[item.eventId] = { count: 0, users: [] };
    acc[item.eventId].count += 1;
    acc[item.eventId].users.push(item.user);
    return acc;
  }, {});

  res.json(summary);
});

router.get('/events/:id/confirmations', authorize('events', 'agenda'), async (req, res) => {
  const confirmations = await prisma.eventConfirmation.findMany({
    where: { eventId: req.params.id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, email: true, role: true, whatsapp: true } } },
  });
  res.json({
    count: confirmations.length,
    confirmations,
  });
});

export default router;
