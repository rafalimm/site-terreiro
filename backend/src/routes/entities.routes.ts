import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('entities'));

router.get('/', async (_req, res) => {
  res.json(await prisma.entity.findMany());
});

router.post('/', async (req, res) => {
  const entity = await prisma.entity.create({ data: req.body });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'Entidade', `Criou a entidade "${entity.name}"`);
  res.status(201).json(entity);
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    const entity = await prisma.entity.update({ where: { id: req.params.id }, data });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Entidade', `Editou a entidade "${entity.name}"`);
    res.json(entity);
  } catch {
    res.status(404).json({ error: 'Entidade não encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entity = await prisma.entity.delete({ where: { id: req.params.id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Entidade', `Excluiu a entidade "${entity.name}"`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Entidade não encontrada.' });
  }
});

export default router;
