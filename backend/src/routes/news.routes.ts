import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('news'));

router.get('/', async (_req, res) => {
  res.json(await prisma.newsItem.findMany({ orderBy: { publishedAt: 'desc' } }));
});

router.post('/', async (req, res) => {
  const item = await prisma.newsItem.create({ data: req.body });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'Notícia', `Criou a notícia "${item.title}"`);
  res.status(201).json(item);
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    const item = await prisma.newsItem.update({ where: { id: req.params.id }, data });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Notícia', `Editou a notícia "${item.title}"`);
    res.json(item);
  } catch {
    res.status(404).json({ error: 'Notícia não encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await prisma.newsItem.delete({ where: { id: req.params.id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Notícia', `Excluiu a notícia "${item.title}"`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Notícia não encontrada.' });
  }
});

export default router;
