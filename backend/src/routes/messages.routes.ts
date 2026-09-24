import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('messages'));

router.get('/', async (_req, res) => {
  res.json(await prisma.contactMessage.findMany({ orderBy: { receivedAt: 'desc' } }));
});

router.patch('/:id/lida', async (req, res) => {
  try {
    const msg = await prisma.contactMessage.update({ where: { id: req.params.id }, data: { read: true } });
    res.json(msg);
  } catch {
    res.status(404).json({ error: 'Mensagem não encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Mensagem', `Excluiu a mensagem ID ${req.params.id}`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Mensagem não encontrada.' });
  }
});

export default router;
