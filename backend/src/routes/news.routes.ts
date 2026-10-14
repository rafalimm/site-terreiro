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
  const body = req.body ?? {};
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  const content = typeof body.content === 'string' ? body.content.slice(0, 20000) : '';
  if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
  const item = await prisma.newsItem.create({ data: {
    title, content,
    image: typeof body.image === 'string' ? body.image.slice(0, 5000) : null,
    category: typeof body.category === 'string' ? body.category.slice(0, 120) : '',
    author: typeof body.author === 'string' ? body.author.slice(0, 120) : '',
    publishedAt: typeof body.publishedAt === 'string' ? body.publishedAt.slice(0, 40) : new Date().toISOString(),
    active: typeof body.active === 'boolean' ? body.active : true,
  } });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'Notícia', `Criou a notícia "${item.title}"`);
  res.status(201).json(item);
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof body.title === 'string') data.title = body.title.trim().slice(0, 200);
    if (typeof body.content === 'string') data.content = body.content.slice(0, 20000);
    if (typeof body.image === 'string' || body.image === null) data.image = body.image === null ? null : body.image.slice(0, 5000);
    if (typeof body.category === 'string') data.category = body.category.slice(0, 120);
    if (typeof body.author === 'string') data.author = body.author.slice(0, 120);
    if (typeof body.publishedAt === 'string') data.publishedAt = body.publishedAt.slice(0, 40);
    if (typeof body.active === 'boolean') data.active = body.active;
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });
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
