import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';
import { toRelativeImageUrl, deleteUploadedImage, uploadedImageId } from '../utils/images';

const router = Router();
router.use(authenticate, authorize('entities'));

router.get('/', async (_req, res) => {
  res.json(await prisma.entity.findMany());
});

router.post('/', async (req, res) => {
  const entity = await prisma.entity.create({ data: { ...req.body, image: toRelativeImageUrl(req.body.image) || null } });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'Entidade', `Criou a entidade "${entity.name}"`);
  res.status(201).json(entity);
});

router.patch('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.id;
    if ('image' in data) data.image = toRelativeImageUrl(data.image) || null;
    const before = await prisma.entity.findUnique({ where: { id: req.params.id } });
    const entity = await prisma.entity.update({ where: { id: req.params.id }, data });
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
