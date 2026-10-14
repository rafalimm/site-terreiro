import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('services'));

router.get('/', async (_req, res) => {
  res.json(await prisma.serviceInfo.findMany());
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body ?? {};
    const data: any = {};
    if (typeof body.title === 'string') data.title = body.title.trim().slice(0, 200);
    if (typeof body.description === 'string') data.description = body.description.slice(0, 10000);
    if (typeof body.howItWorks === 'string') data.howItWorks = body.howItWorks.slice(0, 10000);
    if (typeof body.duration === 'string') data.duration = body.duration.slice(0, 120);
    if (typeof body.orientation === 'string') data.orientation = body.orientation.slice(0, 5000);
    if (typeof body.requiresScheduling === 'boolean') data.requiresScheduling = body.requiresScheduling;
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });
    const item = await prisma.serviceInfo.update({ where: { id: req.params.id }, data });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Serviço', `Editou o serviço "${item.title}"`);
    res.json(item);
  } catch {
    res.status(404).json({ error: 'Serviço não encontrado.' });
  }
});

export default router;
