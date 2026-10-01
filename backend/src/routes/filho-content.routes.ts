import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();

const MEMBER_ROLES = ['super_admin','admin','agenda','content','atendimento','filho'] as const;
const MANAGER_ROLES = ['super_admin','admin','content'] as const;

function isMember(role: string) {
  return MEMBER_ROLES.includes(role as typeof MEMBER_ROLES[number]);
}

function isManager(role: string) {
  return MANAGER_ROLES.includes(role as typeof MANAGER_ROLES[number]);
}

router.use(authenticate);

router.get('/', authorize('filho_content'), async (req, res) => {
  if (!isMember(req.user!.role)) return res.status(403).json({ error: 'Área exclusiva para Filhos e cargos superiores.' });

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { degree: true },
  });

  const degrees = await prisma.degree.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      modules: { where: { active: true }, orderBy: { sortOrder: 'asc' }, include: { contents: { where: { published: true }, orderBy: { sortOrder: 'asc' } } } },
      contents: { where: { published: true, moduleId: null }, orderBy: { sortOrder: 'asc' } },
    },
  });

  const maxOrder = user?.degree?.sortOrder ?? 0;
  const allowed = degrees.filter(d => d.sortOrder <= maxOrder || user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'content');

  const progress = await prisma.filhoContentProgress.findMany({ where: { userId: req.user!.id } });
  const done = new Set(progress.filter(p => p.completed).map(p => p.contentId));

  res.json({
    degree: user?.degree ? { id: user.degree.id, name: user.degree.name, description: user.degree.description, sortOrder: user.degree.sortOrder } : null,
    degrees: allowed,
    completedContentIds: [...done],
  });
});

router.post('/progress/:contentId', authorize('filho_content'), async (req, res) => {
  if (!isMember(req.user!.role)) return res.status(403).json({ error: 'Acesso negado.' });
  const content = await prisma.filhoContent.findUnique({ where: { id: req.params.contentId }, include: { degree: true } });
  if (!content) return res.status(404).json({ error: 'Conteúdo não encontrado.' });
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { degree: true } });
  if (!user?.degree || content.degree.sortOrder > user.degree.sortOrder) return res.status(403).json({ error: 'Conteúdo ainda não liberado para seu grau.' });
  const completed = Boolean(req.body?.completed);
  const item = await prisma.filhoContentProgress.upsert({
    where: { userId_contentId: { userId: req.user!.id, contentId: content.id } },
    update: { completed, completedAt: completed ? new Date().toISOString() : null },
    create: { userId: req.user!.id, contentId: content.id, completed, completedAt: completed ? new Date().toISOString() : null },
  });
  res.json(item);
});

router.get('/admin', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Você não pode gerenciar os conteúdos dos Filhos.' });
  const degrees = await prisma.degree.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { modules: { orderBy: { sortOrder: 'asc' }, include: { contents: { orderBy: { sortOrder: 'asc' } } } }, contents: { where: { moduleId: null }, orderBy: { sortOrder: 'asc' } } },
  });
  res.json(degrees);
});

router.post('/admin/degrees', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  const now = new Date().toISOString();
  const item = await prisma.degree.create({ data: { name: String(req.body.name || '').trim(), description: String(req.body.description || ''), sortOrder: Number(req.body.sortOrder || 0), active: req.body.active !== false, createdAt: now, updatedAt: now } });
  res.status(201).json(item);
});

router.patch('/admin/degrees/:id', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  const data: any = { ...req.body, updatedAt: new Date().toISOString() };
  delete data.id; delete data.createdAt;
  const item = await prisma.degree.update({ where: { id: req.params.id }, data });
  res.json(item);
});

router.delete('/admin/degrees/:id', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  await prisma.degree.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.post('/admin/modules', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  const now = new Date().toISOString();
  const item = await prisma.contentModule.create({ data: { degreeId: req.body.degreeId, name: String(req.body.name || '').trim(), description: String(req.body.description || ''), sortOrder: Number(req.body.sortOrder || 0), active: req.body.active !== false, createdAt: now, updatedAt: now } });
  res.status(201).json(item);
});

router.patch('/admin/modules/:id', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  const data: any = { ...req.body, updatedAt: new Date().toISOString() }; delete data.id; delete data.createdAt;
  const item = await prisma.contentModule.update({ where: { id: req.params.id }, data }); res.json(item);
});

router.delete('/admin/modules/:id', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  await prisma.contentModule.delete({ where: { id: req.params.id } }); res.status(204).send();
});

router.post('/admin/contents', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  const now = new Date().toISOString();
  const item = await prisma.filhoContent.create({ data: { degreeId: req.body.degreeId, moduleId: req.body.moduleId || null, title: String(req.body.title || '').trim(), description: String(req.body.description || ''), type: String(req.body.type || 'text'), body: String(req.body.body || ''), mediaUrl: req.body.mediaUrl || null, coverUrl: req.body.coverUrl || null, sortOrder: Number(req.body.sortOrder || 0), published: req.body.published !== false, createdAt: now, updatedAt: now } });
  res.status(201).json(item);
});

router.patch('/admin/contents/:id', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  const data: any = { ...req.body, updatedAt: new Date().toISOString() }; delete data.id; delete data.createdAt;
  const item = await prisma.filhoContent.update({ where: { id: req.params.id }, data }); res.json(item);
});

router.delete('/admin/contents/:id', authorize('filho_content'), async (req, res) => {
  if (!isManager(req.user!.role)) return res.status(403).json({ error: 'Sem permissão.' });
  await prisma.filhoContent.delete({ where: { id: req.params.id } }); res.status(204).send();
});

export default router;
