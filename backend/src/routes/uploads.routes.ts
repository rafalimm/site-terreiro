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


const MAX_FILE_BYTES = 20 * 1024 * 1024;

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav'],
  'audio/ogg': ['ogg'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

function detectFileMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return 'image/png';
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.length >= 4 && buf.subarray(0, 4).toString() === '%PDF') return 'application/pdf';
  if (buf.length >= 12 && buf.subarray(4, 8).toString() === 'ftyp') return 'video/mp4';
  if (buf.length >= 4 && buf.subarray(0, 4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))) return 'video/webm';
  if (buf.length >= 4 && buf.subarray(0, 4).toString() === 'OggS') return 'audio/ogg';
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WAVE') return 'audio/wav';
  if (buf.length >= 3 && buf.subarray(0, 3).toString() === 'ID3') return 'audio/mpeg';
  return null;
}

export const contentFilesRouter = Router();
contentFilesRouter.use(authenticate, authorize('filho_content'));

contentFilesRouter.post('/', async (req, res) => {
  const dataUrl = req.body?.dataUrl;
  const originalName = typeof req.body?.originalName === 'string' ? req.body.originalName.slice(0, 180) : 'arquivo';

  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:') || !dataUrl.includes(';base64,')) {
    return res.status(400).json({ error: 'Envie um arquivo válido.' });
  }

  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(5, comma);
  const buffer = Buffer.from(dataUrl.slice(comma + 1), 'base64');

  if (buffer.length === 0 || buffer.length > MAX_FILE_BYTES) {
    return res.status(413).json({ error: 'O arquivo é muito grande. O limite é de 20 MB.' });
  }

  const detectedMime = detectFileMime(buffer);
  const declaredMime = header.split(';')[0].toLowerCase();
  const mimeType = detectedMime || declaredMime;

  if (!ALLOWED_FILE_TYPES[mimeType]) {
    return res.status(400).json({ error: 'Formato não suportado. Use PDF, MP4, WebM, MP3, WAV, OGG, JPG, PNG ou WebP.' });
  }

  if (detectedMime && detectedMime !== declaredMime) {
    return res.status(400).json({ error: 'O conteúdo do arquivo não corresponde ao tipo informado.' });
  }

  try {
    const file = await prisma.uploadedFile.create({
      data: { mimeType, originalName, size: buffer.length, data: buffer },
    });
    return res.status(201).json({ url: `/api/files/${file.id}`, name: originalName, size: file.size, mimeType });
  } catch (error) {
    console.error('Erro ao salvar arquivo de conteúdo:', error);
    return res.status(500).json({ error: 'Não foi possível salvar o arquivo.' });
  }
});

export const filesRouter = Router();

filesRouter.get('/:id', async (req, res) => {
  try {
    const file = await prisma.uploadedFile.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ error: 'Arquivo não encontrado.' });
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.originalName.replace(/["\\\\]/g, '')}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    return res.send(Buffer.from(file.data));
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
    return res.status(500).json({ error: 'Erro ao carregar o arquivo.' });
  }
});
