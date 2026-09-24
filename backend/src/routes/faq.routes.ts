import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('faq'));

router.get('/', async (_req, res) => {
  res.json(await prisma.fAQItem.findMany({ orderBy: { order: 'asc' } }));
});

router.post('/', async (req, res) => {
  const item = await prisma.fAQItem.create({ data: req.body });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'FAQ', `Criou a pergunta "${item.question}"`);
  res.status(201).json(item);
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    const item = await prisma.fAQItem.update({ where: { id: req.params.id }, data });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'FAQ', `Editou a pergunta "${item.question}"`);
    res.json(item);
  } catch {
    res.status(404).json({ error: 'Pergunta não encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await prisma.fAQItem.delete({ where: { id: req.params.id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'FAQ', `Excluiu a pergunta "${item.question}"`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Pergunta não encontrada.' });
  }
});

export default router;
