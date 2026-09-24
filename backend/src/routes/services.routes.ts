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
    const data = { ...req.body };
    delete data.id;
    const item = await prisma.serviceInfo.update({ where: { id: req.params.id }, data });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Serviço', `Editou o serviço "${item.title}"`);
    res.json(item);
  } catch {
    res.status(404).json({ error: 'Serviço não encontrado.' });
  }
});

export default router;
