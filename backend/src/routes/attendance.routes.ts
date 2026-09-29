import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

const ACTIVE_STATUSES = ['arrived', 'called', 'in_service'];

const canManageQueue = (role: string) =>
  role === 'super_admin' || role === 'admin' || role === 'agenda';

router.get('/attendance/mine', async (req, res) => {
  try {
    const attendances = await prisma.giraAttendance.findMany({
      where: { userId: req.user!.id },
      orderBy: { confirmedAt: 'desc' },
      include: {
        event: {
          select: { id: true, title: true, date: true, time: true, type: true },
        },
        entity: { select: { id: true, name: true, line: true, active: true } },
      },
    });
    res.json(attendances);
  } catch (error) {
    console.error('Erro ao carregar filas do usuário:', error);
    res.status(500).json({ error: 'Não foi possível carregar suas filas.' });
  }
});

router.get('/attendance/queue-events', async (_req, res) => {
  try {
    const events = await prisma.giraEvent.findMany({ orderBy: { date: 'asc' } });
    res.json(events);
  } catch (error) {
    console.error('Erro ao carregar giras da fila:', error);
    res.status(500).json({ error: 'Não foi possível carregar as giras da fila.' });
  }
});

router.get('/attendance/token/:token', authorize('agenda', 'events', 'fila'), async (req, res) => {
  const attendance = await prisma.giraAttendance.findUnique({
    where: { qrToken: req.params.token },
    include: {
      user: { select: { id: true, name: true, email: true, whatsapp: true, role: true } },
      event: { select: { id: true, title: true, date: true, time: true, type: true } },
    },
  });
  if (!attendance) return res.status(404).json({ error: 'QR Code não encontrado ou inválido.' });
  res.json(attendance);
});

router.get('/admin/events/:eventId/attendance', authorize('agenda', 'events', 'fila'), async (req, res) => {
  const event = await prisma.giraEvent.findUnique({ where: { id: req.params.eventId } });
  if (!event) return res.status(404).json({ error: 'Gira não encontrada.' });

  const configuredEntityIds = Array.isArray(event.entityIds)
    ? event.entityIds.filter((id): id is string => typeof id === 'string')
    : [];

  const entities = configuredEntityIds.length
    ? await prisma.entity.findMany({
        where: { id: { in: configuredEntityIds } },
        orderBy: { name: 'asc' },
      })
    : [];

  const attendances = await prisma.giraAttendance.findMany({
    where: { eventId: event.id },
    orderBy: [{ queueNumber: 'asc' }, { confirmedAt: 'asc' }],
    include: {
      user: { select: { id: true, name: true, email: true, whatsapp: true, role: true } },
      entity: { select: { id: true, name: true, line: true, active: true } },
    },
  });

  const busyEntityIds = new Set(
    attendances
      .filter(a => ACTIVE_STATUSES.includes(a.status) && a.entityId)
      .map(a => a.entityId as string)
  );

  const availableEntities = entities.filter(entity => entity.active && !busyEntityIds.has(entity.id));
  const firstVisitEntityIds = Array.isArray(event.firstVisitEntityIds) ? event.firstVisitEntityIds.filter((id): id is string => typeof id === 'string') : [];
  const availableFirstVisitEntities = availableEntities.filter(entity => firstVisitEntityIds.includes(entity.id));

  const entityHistory = entities.map(entity => {
    const records = attendances.filter(a => a.entityId === entity.id && a.status === 'attended');
    return {
      entity,
      attendedCount: records.length,
      consulentes: records.map(a => ({
        attendanceId: a.id,
        userId: a.user.id,
        name: a.user.name,
        queueNumber: a.queueNumber,
        attendedAt: a.attendedAt,
      })),
    };
  });

  const counts = {
    confirmed: attendances.filter(a => a.status === 'confirmed').length,
    arrived: attendances.filter(a => a.status === 'arrived').length,
    called: attendances.filter(a => a.status === 'called').length,
    inService: attendances.filter(a => a.status === 'in_service').length,
    attended: attendances.filter(a => a.status === 'attended').length,
  };

  res.json({ event, counts, attendances, entities, availableEntities, availableFirstVisitEntities, entityHistory });
});

router.post('/admin/events/:eventId/attendance/check-in', authorize('agenda', 'events', 'fila'), async (req, res) => {
  try {
    const attendance = await prisma.giraAttendance.findUnique({
      where: { qrToken: String(req.body.qrToken || '') },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    if (!attendance || attendance.eventId !== req.params.eventId) {
      return res.status(404).json({ error: 'QR Code não pertence a esta gira.' });
    }

    if (attendance.status === 'attended') {
      return res.status(400).json({ error: 'Esta pessoa já foi atendida.' });
    }

    if (attendance.status !== 'confirmed') {
      return res.status(400).json({ error: 'Esta presença já foi registrada na fila.' });
    }

    const isFirstVisit = req.body.isFirstVisit === true;

    const last = await prisma.giraAttendance.findFirst({
      where: { eventId: attendance.eventId, queueNumber: { not: null } },
      orderBy: { queueNumber: 'desc' },
      select: { queueNumber: true },
    });

    const queueNumber = (last?.queueNumber ?? 0) + 1;
    const updated = await prisma.giraAttendance.update({
      where: { id: attendance.id },
      data: {
        queueNumber,
        status: 'arrived',
        isFirstVisit,
        checkedInAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao registrar chegada:', error);
    res.status(409).json({ error: 'Não foi possível gerar a senha. Tente novamente.' });
  }
});

router.post('/admin/events/:eventId/attendance/:attendanceId/call', authorize('agenda', 'events', 'fila'), async (req, res) => {
  try {
    const current = await prisma.giraAttendance.findUnique({
      where: { id: req.params.attendanceId },
      include: { event: true },
    });
    if (!current || current.eventId !== req.params.eventId) return res.status(404).json({ error: 'Pessoa não encontrada na fila.' });
    if (current.status !== 'arrived') return res.status(400).json({ error: 'Somente pessoas aguardando podem ser chamadas.' });

    const entityId = typeof req.body.entityId === 'string' && req.body.entityId.trim()
      ? req.body.entityId.trim()
      : null;

    const firstVisitEntityIdsForCall = Array.isArray(current.event.firstVisitEntityIds) ? current.event.firstVisitEntityIds.filter((id): id is string => typeof id === 'string') : [];
    if (current.isFirstVisit && firstVisitEntityIdsForCall.length > 0 && (!entityId || !firstVisitEntityIdsForCall.includes(entityId))) {
      return res.status(400).json({ error: 'Para primeira vez, selecione uma entidade destinada a novos consulentes.' });
    }

    const configuredEntityIds = Array.isArray(current.event.entityIds)
      ? current.event.entityIds.filter((id): id is string => typeof id === 'string')
      : [];

    if (configuredEntityIds.length > 0 && !entityId) {
      return res.status(400).json({ error: 'Selecione uma entidade disponível antes de chamar.' });
    }

    if (entityId && !configuredEntityIds.includes(entityId)) {
      return res.status(400).json({ error: 'A entidade selecionada não pertence a esta gira.' });
    }

    if (entityId) {
      const entity = await prisma.entity.findUnique({ where: { id: entityId } });
      if (!entity || !entity.active) {
        return res.status(400).json({ error: 'A entidade selecionada está indisponível.' });
      }

      const busy = await prisma.giraAttendance.findFirst({
        where: {
          eventId: current.eventId,
          entityId,
          status: { in: ACTIVE_STATUSES },
          id: { not: current.id },
        },
        select: { id: true },
      });

      if (busy) {
        return res.status(409).json({ error: 'Esta entidade já está em atendimento. Escolha outra entidade disponível.' });
      }
    }

    const updated = await prisma.giraAttendance.update({
      where: { id: current.id },
      data: {
        status: 'called',
        entityId,
        calledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        entity: { select: { id: true, name: true, line: true, active: true } },
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Não foi possível chamar a pessoa.' });
  }
});

router.post('/admin/events/:eventId/attendance/:attendanceId/start', authorize('agenda', 'events', 'fila'), async (req, res) => {
  try {
    const current = await prisma.giraAttendance.findUnique({ where: { id: req.params.attendanceId } });
    if (!current || current.eventId !== req.params.eventId) return res.status(404).json({ error: 'Pessoa não encontrada na fila.' });
    if (current.status !== 'called') return res.status(400).json({ error: 'A pessoa precisa ser chamada antes de iniciar o atendimento.' });

    const updated = await prisma.giraAttendance.update({
      where: { id: current.id },
      data: { status: 'in_service', serviceStartedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Não foi possível iniciar o atendimento.' });
  }
});

router.post('/admin/events/:eventId/attendance/:attendanceId/complete', authorize('agenda', 'events', 'fila'), async (req, res) => {
  try {
    const current = await prisma.giraAttendance.findUnique({ where: { id: req.params.attendanceId } });
    if (!current || current.eventId !== req.params.eventId) return res.status(404).json({ error: 'Pessoa não encontrada na fila.' });
    if (current.status !== 'in_service') return res.status(400).json({ error: 'O atendimento precisa estar em andamento.' });

    const updated = await prisma.giraAttendance.update({
      where: { id: current.id },
      data: { status: 'attended', attendedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Não foi possível finalizar o atendimento.' });
  }
});

export default router;
