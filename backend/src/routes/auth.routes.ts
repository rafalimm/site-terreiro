import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';

const router = Router();

function sanitize<T extends { password?: string }>(user: T) {
  const { password, ...rest } = user;
  return rest;
}

// POST /api/auth/login — login de qualquer usuário (equipe ou consulente)
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !user.active) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: sanitize(user) });
});

// POST /api/auth/register — cadastro público de consulente (usado pela página "Entrar / Criar conta")
router.post('/register', async (req, res) => {
  const { name, email, password, whatsapp } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }
  const normalizedEmail = String(email).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: 'Já existe uma conta cadastrada com esse e-mail.' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashed,
      whatsapp: whatsapp || null,
      role: 'consulente',
      active: true,
      createdAt: new Date().toISOString(),
    },
  });
  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ token, user: sanitize(user) });
});

// GET /api/auth/me — retoma a sessão a partir do token salvo no navegador
router.post('/profile-photo', authenticate, async (req, res) => {
  const dataUrl = req.body?.dataUrl;
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Envie uma imagem válida.' });
  }
  const comma = dataUrl.indexOf(',');
  if (comma === -1 || !dataUrl.slice(0, comma).endsWith(';base64')) {
    return res.status(400).json({ error: 'Formato de imagem inválido.' });
  }

  const buffer = Buffer.from(dataUrl.slice(comma + 1), 'base64');
  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'A imagem é muito grande (máximo de 5 MB).' });
  }

  const header = dataUrl.slice(0, comma).toLowerCase();
  const mimeType = header.includes('image/jpeg') ? 'image/jpeg'
    : header.includes('image/png') ? 'image/png'
    : header.includes('image/webp') ? 'image/webp'
    : null;

  if (!mimeType) {
    return res.status(400).json({ error: 'Use uma imagem JPG, PNG ou WebP.' });
  }

  try {
    const image = await prisma.uploadedImage.create({
      data: {
        mimeType,
        data: buffer,
        createdAt: new Date().toISOString(),
      },
    });
    const profilePhoto = `/api/images/${image.id}`;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { profilePhoto },
    });
    return res.json(sanitize(user));
  } catch (error) {
    console.error('Erro ao salvar foto de perfil:', error);
    return res.status(500).json({ error: 'Não foi possível salvar a foto de perfil.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json(sanitize(user));
});

export default router;
