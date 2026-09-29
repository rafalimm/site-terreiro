import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB por imagem (o painel já reduz antes de enviar)

// Descobre o tipo real pelos primeiros bytes, sem confiar no que o navegador declarou.
function detectMime(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

// POST /api/admin/uploads — recebe { dataUrl } e devolve { url }
export const uploadsRouter = Router();
uploadsRouter.use(authenticate, authorize('gallery', 'entities', 'news'));

uploadsRouter.post('/', async (req, res) => {
  const dataUrl = req.body?.dataUrl;
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Envie uma imagem válida.' });
  }
  const comma = dataUrl.indexOf(',');
  if (comma === -1 || !dataUrl.slice(0, comma).endsWith(';base64')) {
    return res.status(400).json({ error: 'Formato de imagem inválido.' });
  }
  const buffer = Buffer.from(dataUrl.slice(comma + 1), 'base64');
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: 'A imagem é muito grande (máximo de 5 MB).' });
  }
  const mimeType = detectMime(buffer);
  if (!mimeType) {
    return res.status(400).json({ error: 'Use uma imagem JPG, PNG ou WebP.' });
  }
  try {
    const image = await prisma.uploadedImage.create({
      data: { mimeType, data: buffer, createdAt: new Date().toISOString() },
    });
    res.status(201).json({ url: `/api/images/${image.id}` });
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    res.status(500).json({ error: 'Não foi possível salvar a imagem.' });
  }
});

// GET /api/images/:id — público (as imagens aparecem no site para todo mundo)
export const imagesRouter = Router();

imagesRouter.get('/:id', async (req, res) => {
  try {
    const image = await prisma.uploadedImage.findUnique({ where: { id: req.params.id } });
    if (!image) return res.status(404).json({ error: 'Imagem não encontrada.' });
    res.set({
      'Content-Type': image.mimeType,
      // O id nunca se repete: a imagem pode ficar em cache "para sempre" no navegador.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    res.send(Buffer.from(image.data));
  } catch (error) {
    console.error('Erro ao ler imagem:', error);
    res.status(500).json({ error: 'Erro ao carregar a imagem.' });
  }
});
