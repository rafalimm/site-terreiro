import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('events', 'agenda'));

router.get('/', async (_req, res) => {
  const events = await prisma.giraEvent.findMany({ orderBy: { date: 'asc' } });
  res.json(events);
});

router.post('/', async (req, res) => {
  const data = { ...req.body, date: typeof req.body.date === 'string' ? req.body.date.slice(0, 10) : req.body.date };
  const event = await prisma.giraEvent.create({
    data: { ...data, createdBy: req.user!.name, createdAt: new Date().toISOString() },
  });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'Gira/Evento', `Criou o evento "${event.title}"`);
  res.status(201).json(event);
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (typeof data.date === 'string') data.date = data.date.slice(0, 10);
    delete data.id;
    delete data.createdAt;
    const event = await prisma.giraEvent.update({ where: { id: req.params.id }, data });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Gira/Evento', `Editou o evento "${event.title}"`);
    res.json(event);
  } catch {
    res.status(404).json({ error: 'Evento não encontrado.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const event = await prisma.giraEvent.delete({ where: { id: req.params.id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Gira/Evento', `Excluiu o evento "${event.title}"`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Evento não encontrado.' });
  }
});

export default router;
