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
  const body = req.body ?? {};
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : '';
  const answer = typeof body.answer === 'string' ? body.answer.slice(0, 10000) : '';
  if (!question || !answer) return res.status(400).json({ error: 'Pergunta e resposta são obrigatórias.' });
  const item = await prisma.fAQItem.create({ data: {
    question, answer,
    order: Number.isInteger(body.order) && body.order >= 0 && body.order <= 10000 ? body.order : 0,
    active: typeof body.active === 'boolean' ? body.active : true,
  } });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'FAQ', `Criou a pergunta "${item.question}"`);
  res.status(201).json(item);
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof body.question === 'string') data.question = body.question.trim().slice(0, 500);
    if (typeof body.answer === 'string') data.answer = body.answer.slice(0, 10000);
    if (Number.isInteger(body.order) && body.order >= 0 && body.order <= 10000) data.order = body.order;
    if (typeof body.active === 'boolean') data.active = body.active;
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });
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
