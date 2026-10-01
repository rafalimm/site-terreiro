import { Router } from 'express';
import { Readable } from 'stream';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { uploadToSupabaseStorage } from '../storage/supabaseStorage';

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
uploadsRouter.use(authenticate, authorize('gallery', 'entities', 'news', 'filho_content'));

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


const MAX_FILE_BYTES = 50 * 1024 * 1024;

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
  // MP3 também pode ser válido sem tag ID3: procura um frame MPEG válido no início do arquivo.
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  return null;
}

export const contentFilesRouter = Router();
contentFilesRouter.use(authenticate, authorize('filho_content'));
contentFilesRouter.use((req, res, next) => {
  const role = req.user?.role;
  if (!['super_admin', 'admin', 'content'].includes(role || '')) {
    return res.status(403).json({ error: 'Somente administradores de conteúdo podem enviar arquivos.' });
  }
  next();
});

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
    return res.status(413).json({ error: 'O arquivo é muito grande. O limite é de 50 MB.' });
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
    const stored = await uploadToSupabaseStorage(buffer, mimeType, originalName);
    const file = await prisma.uploadedFile.create({
      data: { mimeType, originalName, size: buffer.length, storagePath: stored.path },
    });
    return res.status(201).json({ url: `/api/files/${file.id}`, name: originalName, size: file.size, mimeType });
  } catch (error) {
    console.error('Erro ao salvar arquivo de conteúdo:', error);
    return res.status(500).json({ error: 'Não foi possível salvar o arquivo.' });
  }
});

export const filesRouter = Router();

async function serveStoredFile(req: any, res: any) {
  try {
    const file = await prisma.uploadedFile.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ error: 'Arquivo não encontrado.' });

    if (file.storagePath) {
      const rawBase = (process.env.SUPABASE_URL || '').trim().replace(/\\/+$/, '');
      const base = /^https?:\\/\\//i.test(rawBase) ? rawBase : rawBase ? `https://${rawBase}` : '';
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'filho-content';
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (!base || !serviceKey) return res.status(500).json({ error: 'Armazenamento não configurado.' });

      const storageUrl = `${base}/storage/v1/object/${encodeURIComponent(bucket)}/${file.storagePath.split('/').map(encodeURIComponent).join('/')}`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      };
      const range = req.headers.range;
      if (typeof range === 'string' && range) headers.Range = range;

      const storageResponse = await fetch(storageUrl, { headers });
      if (!storageResponse.ok && storageResponse.status !== 206) {
        const detail = await storageResponse.text();
        console.error('Erro ao ler arquivo do Supabase Storage:', storageResponse.status, detail.slice(0, 300));
        return res.status(storageResponse.status === 404 ? 404 : 502).json({ error: 'Não foi possível carregar o arquivo.' });
      }

      const responseHeaders: Record<string, string> = {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName.replace(/["\\\\\\r\\n]/g, '')}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      };
      const contentLength = storageResponse.headers.get('content-length');
      const contentRange = storageResponse.headers.get('content-range');
      if (contentLength) responseHeaders['Content-Length'] = contentLength;
      if (contentRange) responseHeaders['Content-Range'] = contentRange;
      res.set(responseHeaders);
      res.status(storageResponse.status);

      if (req.method === 'HEAD') return res.end();
      if (!storageResponse.body) return res.end();
      return Readable.fromWeb(storageResponse.body as any).pipe(res);
    }

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.originalName.replace(/["\\\\\\r\\n]/g, '')}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Accept-Ranges': 'bytes',
    });
    if (file.data) {
      res.set('Content-Length', String(file.data.length));
      return req.method === 'HEAD' ? res.end() : res.send(Buffer.from(file.data));
    }
    return res.status(404).json({ error: 'Arquivo não encontrado.' });
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
    return res.status(500).json({ error: 'Erro ao carregar o arquivo.' });
  }
}

export const filesRouter = Router();
filesRouter.get('/:id', serveStoredFile);
filesRouter.head('/:id', serveStoredFile);
