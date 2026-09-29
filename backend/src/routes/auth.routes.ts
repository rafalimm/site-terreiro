import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';

const router = Router();

function sanitize<T extends { password?: string | null }>(user: T) {
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
  if (!user.password || user.registrationCompleted === false) {
    return res.status(401).json({ error: 'Este cadastro ainda não foi concluído. Use a opção de pré-cadastro.' });
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



// GET /api/auth/pre-registration/:cpf — consulta pública de um pré-cadastro pendente
router.get('/pre-registration/:cpf', async (req, res) => {
  const cpf = String(req.params.cpf || '').replace(/\D/g, '');
  if (cpf.length !== 11) return res.status(400).json({ error: 'Informe um CPF válido.' });

  const user = await prisma.user.findFirst({
    where: { cpfCnpj: cpf, registrationCompleted: false },
    select: { id: true, name: true, cpfCnpj: true, registrationCompleted: true },
  });

  if (!user) return res.status(404).json({ error: 'Não encontramos um pré-cadastro pendente para este CPF.' });

  const attendance = await prisma.giraAttendance.findFirst({
    where: { userId: user.id },
    orderBy: { confirmedAt: 'desc' },
    select: {
      queueNumber: true,
      qrToken: true,
      status: true,
      event: { select: { id: true, title: true, date: true, time: true } },
    },
  });

  return res.json({ user, attendance });
});

// POST /api/auth/pre-registration/complete — conclui o cadastro pelo CPF
router.post('/pre-registration/complete', async (req, res) => {
  try {
    const cpf = String(req.body?.cpf || '').replace(/\D/g, '');
    const email = String(req.body?.email || '').trim().toLowerCase();
    const whatsapp = String(req.body?.whatsapp || '').trim();
    const password = String(req.body?.password || '');

    if (cpf.length !== 11) return res.status(400).json({ error: 'Informe um CPF válido.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Informe um e-mail válido.' });
    if (password.length < 6) return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    if (!whatsapp) return res.status(400).json({ error: 'Informe o WhatsApp.' });

    const user = await prisma.user.findFirst({
      where: { cpfCnpj: cpf, registrationCompleted: false },
    });
    if (!user) return res.status(404).json({ error: 'Pré-cadastro não encontrado ou já concluído.' });

    const emailInUse = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (emailInUse) return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });

    const hashed = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        whatsapp,
        password: hashed,
        registrationCompleted: true,
        registrationCompletedAt: new Date().toISOString(),
      },
    });

    const token = signToken({ userId: updated.id, role: updated.role });
    return res.json({ token, user: sanitize(updated) });
  } catch (error) {
    console.error('Erro ao concluir pré-cadastro:', error);
    return res.status(500).json({ error: 'Não foi possível concluir o cadastro.' });
  }
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
    // A foto já chega comprimida pelo frontend. Salvamos o próprio data URL
    // no usuário para que ela continue disponível após recarregar a conta,
    // sem depender de uma segunda requisição para /api/images.
    const profilePhoto = dataUrl;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { profilePhoto },
    });
    return res.json({ url: profilePhoto, user: sanitize(user) });
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
