import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('gallery'));

router.get('/', async (_req, res) => {
  res.json(await prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.post('/', async (req, res) => {
  const item = await prisma.galleryItem.create({ data: { ...req.body, createdAt: new Date().toISOString() } });
  await createLog(req.user!.id, req.user!.name, 'Adicionou', 'Galeria', `Adicionou a foto "${item.title}"`);
  res.status(201).json(item);
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    delete data.createdAt;
    const item = await prisma.galleryItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch {
    res.status(404).json({ error: 'Foto não encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.galleryItem.delete({ where: { id: req.params.id } });
    await createLog(req.user!.id, req.user!.name, 'Removeu', 'Galeria', `Removeu foto ID ${req.params.id}`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Foto não encontrada.' });
  }
});

export default router;
