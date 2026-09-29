import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';
import { toRelativeImageUrl, deleteUploadedImage, uploadedImageId } from '../utils/images';

const router = Router();
router.use(authenticate, authorize('entities'));

router.get('/lines', async (_req, res) => {
  const lines = await prisma.entityLine.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(lines);
});

router.get('/', async (_req, res) => {
  res.json(await prisma.entity.findMany({ include: { lineCategory: true } }));
});

router.post('/', async (req, res) => {
  try {
    const { lineId, ...rest } = req.body ?? {};
    const lineCategory = await prisma.entityLine.findFirst({ where: { id: lineId, active: true } });
    if (!lineCategory) return res.status(400).json({ error: 'Selecione uma linha válida.' });
    const entity = await prisma.entity.create({
      data: {
        ...rest,
        line: lineCategory.name,
        lineId: lineCategory.id,
        image: toRelativeImageUrl(req.body.image) || null,
      },
      include: { lineCategory: true },
    });
    await createLog(req.user!.id, req.user!.name, 'Criou', 'Entidade', `Criou a entidade "${entity.name}"`);
    res.status(201).json(entity);
  } catch (error) {
    console.error('Erro ao criar entidade:', error);
    res.status(400).json({ error: 'Não foi possível criar a entidade. Selecione uma linha válida.' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    if ('lineId' in data) {
      const lineCategory = await prisma.entityLine.findFirst({ where: { id: data.lineId, active: true } });
      if (!lineCategory) return res.status(400).json({ error: 'Selecione uma linha válida.' });
      data.lineId = lineCategory.id;
      data.line = lineCategory.name;
    }
    if ('lineId' in data) {
      const lineCategory = await prisma.entityLine.findFirst({ where: { id: data.lineId, active: true } });
      if (!lineCategory) return res.status(400).json({ error: 'Selecione uma linha válida.' });
      data.lineId = lineCategory.id;
      data.line = lineCategory.name;
    }
    if ('image' in data) data.image = toRelativeImageUrl(data.image) || null;
    const before = await prisma.entity.findUnique({ where: { id: req.params.id } });
    const entity = await prisma.entity.update({ where: { id: req.params.id }, data, include: { lineCategory: true } });
    // Se a imagem foi trocada ou removida, apaga a antiga enviada pelo painel.
    if (before && uploadedImageId(before.image) && before.image !== entity.image) await deleteUploadedImage(before.image);
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Entidade', `Editou a entidade "${entity.name}"`);
    res.json(entity);
  } catch {
    res.status(404).json({ error: 'Entidade não encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entity = await prisma.entity.delete({ where: { id: req.params.id } });
    await deleteUploadedImage(entity.image);
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Entidade', `Excluiu a entidade "${entity.name}"`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Entidade não encontrada.' });
  }
});

export default router;
