import { Router } from 'express';
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

    const confirmation = await prisma.eventConfirmation.upsert({
      where: { eventId_userId: { eventId: event.id, userId: req.user!.id } },
      create: {
        eventId: event.id,
        userId: req.user!.id,
        createdAt: new Date().toISOString(),
      },
      update: {},
    });

    res.status(201).json({ confirmed: true, confirmation });
  } catch (error) {
    console.error('Erro ao confirmar presença:', error);
    res.status(500).json({ error: 'Não foi possível confirmar sua presença.' });
  }
});

router.delete('/events/:id/confirmation', async (req, res) => {
  try {
    await prisma.eventConfirmation.delete({
      where: { eventId_userId: { eventId: req.params.id, userId: req.user!.id } },
    });
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
