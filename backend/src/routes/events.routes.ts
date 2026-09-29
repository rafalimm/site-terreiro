import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate);
router.get('/', authorize('events', 'agenda', 'fila'), async (_req, res) => {
  const events = await prisma.giraEvent.findMany({ orderBy: { date: 'asc' } });
  res.json(events);
});

router.post('/', authorize('events', 'agenda'), async (req, res) => {
  try {
    const data = {
      title: String(req.body.title || '').trim(),
      date: typeof req.body.date === 'string' ? req.body.date.slice(0, 10) : '',
      time: String(req.body.time || ''),
      type: String(req.body.type || ''),
      description: String(req.body.description || ''),
      orientation: String(req.body.orientation || ''),
      isPublic: req.body.isPublic !== false && String(req.body.type || '') !== 'Gira de Desenvolvimento',
      requiresScheduling: req.body.requiresScheduling === true,
      observations: String(req.body.observations || ''),
      entityIds: Array.isArray(req.body.entityIds) ? req.body.entityIds.filter((id: unknown): id is string => typeof id === 'string') : [],
      createdBy: req.user!.name,
      createdAt: new Date().toISOString(),
    };

    if (!data.title || !data.date) {
      return res.status(400).json({ error: 'Título e data da gira são obrigatórios.' });
    }

    const event = await prisma.giraEvent.create({ data });

    // O registro da gira não pode depender do sistema de logs.
    // Se o log falhar, a gira continua salva no banco e é retornada ao front-end.
    try {
      await createLog(req.user!.id, req.user!.name, 'Criou', 'Gira/Evento', `Criou o evento "${event.title}"`);
    } catch (logError) {
      console.error('Falha ao registrar log da criação da gira:', logError);
    }

    return res.status(201).json(event);
  } catch (error) {
    console.error('Erro ao salvar gira:', error);
    return res.status(500).json({ error: 'Não foi possível salvar a gira no banco de dados.' });
  }
});

router.patch('/:id', authorize('events', 'agenda'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.date === 'string') data.date = data.date.slice(0, 10);
    if (Array.isArray(data.entityIds)) data.entityIds = data.entityIds.filter((id: unknown): id is string => typeof id === 'string');
    if (data.type === 'Gira de Desenvolvimento') data.isPublic = false;
    delete data.id;
    delete data.createdAt;
    const event = await prisma.giraEvent.update({ where: { id: req.params.id }, data });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Gira/Evento', `Editou o evento "${event.title}"`);
    res.json(event);
  } catch {
    res.status(404).json({ error: 'Evento não encontrado.' });
  }
});

router.delete('/:id', authorize('events', 'agenda'), async (req, res) => {
  try {
    const event = await prisma.giraEvent.delete({ where: { id: req.params.id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Gira/Evento', `Excluiu o evento "${event.title}"`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Evento não encontrado.' });
  }
});

export default router;
