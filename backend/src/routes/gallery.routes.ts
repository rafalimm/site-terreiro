import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';
import { toRelativeImageUrl, deleteUploadedImage } from '../utils/images';

const router = Router();
router.use(authenticate, authorize('gallery'));

router.get('/', async (_req, res) => {
  res.json(await prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.post('/', async (req, res) => {
  const body = req.body ?? {};
  const url = typeof body.url === 'string' ? toRelativeImageUrl(body.url) : null;
  if (!url) return res.status(400).json({ error: 'Informe uma imagem válida.' });
  const item = await prisma.galleryItem.create({
    data: {
      url,
      title: typeof body.title === 'string' ? body.title.slice(0, 200) : '',
      description: typeof body.description === 'string' ? body.description.slice(0, 5000) : '',
      category: typeof body.category === 'string' ? body.category.slice(0, 120) : '',
      isMain: body.isMain === true,
      createdAt: new Date().toISOString(),
    },
  });
  await createLog(req.user!.id, req.user!.name, 'Adicionou', 'Galeria', `Adicionou a foto "${item.title}"`);
  res.status(201).json(item);
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof body.url === 'string') {
      const url = toRelativeImageUrl(body.url);
      if (!url) return res.status(400).json({ error: 'Informe uma imagem válida.' });
      data.url = url;
    }
    if (typeof body.title === 'string') data.title = body.title.slice(0, 200);
    if (typeof body.description === 'string') data.description = body.description.slice(0, 5000);
    if (typeof body.category === 'string') data.category = body.category.slice(0, 120);
    if (typeof body.isMain === 'boolean') data.isMain = body.isMain;
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });
    const item = await prisma.galleryItem.update({ where: { id: req.params.id }, data });
    res.json(item);
  } catch {
    res.status(404).json({ error: 'Foto não encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await prisma.galleryItem.delete({ where: { id: req.params.id } });
    await deleteUploadedImage(removed.url);
    await createLog(req.user!.id, req.user!.name, 'Removeu', 'Galeria', `Removeu foto ID ${req.params.id}`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Foto não encontrada.' });
  }
});

export default router;
