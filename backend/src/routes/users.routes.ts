import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, requireSuperAdmin } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate);

function sanitize<T extends { password?: string }>(user: T) {
  const { password, ...rest } = user;
  return rest;
}

// Listar usuários: qualquer cargo com permissão 'consulentes' (admin, atendimento, super_admin)
// consegue ver a lista — é o que alimenta as telas "Usuários & Permissões" e "Consulentes".
router.get('/', authorize('consulentes'), async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users.map(sanitize));
});

// Criar, editar cargo/dados e excluir usuários é exclusivo do Super Administrador,
// exatamente como já era controlado no front-end.
router.post('/', requireSuperAdmin, async (req, res) => {
  const { name, email, password, role, whatsapp, active } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  const normalizedEmail = String(email).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return res.status(409).json({ error: 'Já existe um usuário com esse e-mail.' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashed,
      role: role || 'consulente',
      whatsapp: whatsapp || null,
      active: active ?? true,
      createdAt: new Date().toISOString(),
    },
  });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'Usuário', `Criou o usuário ${user.name}`);
  res.status(201).json(sanitize(user));
});

// PATCH /:id — usado tanto para edição completa quanto para a troca rápida de cargo
router.patch('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const data: Record<string, unknown> = { ...req.body };

  if (data.email) data.email = String(data.email).toLowerCase();
  if (data.password) {
    data.password = await bcrypt.hash(data.password as string, 10);
  } else {
    delete data.password; // não sobrescreve a senha se vier vazia (mesmo comportamento do front-end)
  }
  delete data.id;
  delete data.createdAt;

  try {
    const updated = await prisma.user.update({ where: { id }, data });
    const isRoleChange = typeof data.role === 'string';
    await createLog(
      req.user!.id,
      req.user!.name,
      'Editou',
      'Usuário',
      isRoleChange ? `Definiu o cargo de ${updated.name} como "${data.role}"` : `Editou o usuário ${updated.name}`
    );
    res.json(sanitize(updated));
  } catch {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Você não pode excluir o próprio usuário.' });
  }
  try {
    const deleted = await prisma.user.delete({ where: { id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Usuário', `Excluiu o usuário ${deleted.name}`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Usuário não encontrado.' });
  }
});

export default router;
