import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate);

const MEMBERSHIP_ROLES = ['filho', 'atendimento', 'content', 'agenda', 'admin', 'super_admin'];

function canUseMembership(role: string) {
  return MEMBERSHIP_ROLES.includes(role);
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function dueDateForMonth(referenceMonth: string, dueDay: number) {
  const [year, month] = referenceMonth.split('-').map(Number);
  const safeDay = Math.min(Math.max(dueDay, 1), new Date(year, month, 0).getDate());
  return `${referenceMonth}-${String(safeDay).padStart(2, '0')}`;
}

function statusFor(payment: { status: string; dueDate: string; paidAt: string | null }) {
  if (payment.status === 'paid') return 'paid';
  if (payment.status === 'canceled') return 'canceled';
  return payment.dueDate < new Date().toISOString().slice(0, 10) ? 'overdue' : 'pending';
}

async function ensureCurrentPayment(userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!membership || !membership.active) return null;

  const referenceMonth = monthKey();
  const payment = await prisma.membershipPayment.upsert({
    where: { membershipId_referenceMonth: { membershipId: membership.id, referenceMonth } },
    create: {
      membershipId: membership.id,
      referenceMonth,
      amountCents: membership.monthlyAmountCents,
      dueDate: dueDateForMonth(referenceMonth, membership.dueDay),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    update: {},
  });

  return {
    membership,
    currentPayment: { ...payment, status: statusFor(payment) },
  };
}

router.get('/membership/me', authorize('membership'), async (req, res) => {
  const data = await ensureCurrentPayment(req.user!.id);
  if (!data) return res.json(null);
  const payments = await prisma.membershipPayment.findMany({
    where: { membershipId: data.membership.id },
    orderBy: { referenceMonth: 'desc' },
  });
  res.json({
    membership: {
      id: data.membership.id,
      monthlyAmountCents: data.membership.monthlyAmountCents,
      dueDay: data.membership.dueDay,
      active: data.membership.active,
    },
    currentPayment: data.currentPayment,
    payments: payments.map(payment => ({ ...payment, status: statusFor(payment) })),
  });
});

router.post('/membership/me/payment-request', authorize('membership'), async (req, res) => {
  const data = await ensureCurrentPayment(req.user!.id);
  if (!data) return res.status(404).json({ error: 'Mensalidade não configurada para sua conta.' });
  if (data.currentPayment.status === 'paid') {
    return res.status(400).json({ error: 'A mensalidade deste mês já está paga.' });
  }
  await createLog(req.user!.id, req.user!.name, 'Solicitou', 'Mensalidade', `Solicitou instruções de pagamento da mensalidade ${data.currentPayment.referenceMonth}`);
  res.json({ message: 'Solicitação registrada. A administração poderá enviar as instruções de pagamento.' });
});

// Administração
router.get('/admin/memberships', authorize('membership'), async (_req, res) => {
  const memberships = await prisma.membership.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, whatsapp: true, active: true } },
      payments: { orderBy: { referenceMonth: 'desc' }, take: 12 },
    },
  });

  const result = memberships.map(item => {
    const current = item.payments.find(p => p.referenceMonth === monthKey());
    return {
      id: item.id,
      user: item.user,
      monthlyAmountCents: item.monthlyAmountCents,
      dueDay: item.dueDay,
      active: item.active,
      currentPayment: current ? { ...current, status: statusFor(current) } : null,
      payments: item.payments.map(payment => ({ ...payment, status: statusFor(payment) })),
    };
  });
  res.json(result);
});

router.post('/admin/memberships', authorize('membership'), async (req, res) => {
  const { userId, monthlyAmountCents, dueDay, active } = req.body ?? {};
  const user = await prisma.user.findUnique({ where: { id: String(userId || '') } });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (!canUseMembership(user.role)) return res.status(400).json({ error: 'O cargo deste usuário não pode usar mensalidades.' });

  const amount = Number(monthlyAmountCents);
  const day = Number(dueDay);
  if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: 'Valor da mensalidade inválido.' });
  if (!Number.isInteger(day) || day < 1 || day > 28) return res.status(400).json({ error: 'O vencimento deve estar entre os dias 1 e 28.' });

  const membership = await prisma.membership.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      monthlyAmountCents: amount,
      dueDay: day,
      active: active !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    update: {
      monthlyAmountCents: amount,
      dueDay: day,
      active: active !== false,
      updatedAt: new Date().toISOString(),
    },
  });
  await createLog(req.user!.id, req.user!.name, 'Configurou', 'Mensalidade', `Configurou a mensalidade de ${user.name}`);
  res.status(201).json(membership);
});

router.patch('/admin/memberships/:id', authorize('membership'), async (req, res) => {
  const membership = await prisma.membership.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!membership) return res.status(404).json({ error: 'Mensalidade não encontrada.' });

  const data: Record<string, unknown> = {};
  if (req.body.monthlyAmountCents !== undefined) data.monthlyAmountCents = Number(req.body.monthlyAmountCents);
  if (req.body.dueDay !== undefined) data.dueDay = Number(req.body.dueDay);
  if (req.body.active !== undefined) data.active = Boolean(req.body.active);
  data.updatedAt = new Date().toISOString();

  if (data.monthlyAmountCents !== undefined && (!Number.isInteger(data.monthlyAmountCents) || (data.monthlyAmountCents as number) <= 0)) {
    return res.status(400).json({ error: 'Valor da mensalidade inválido.' });
  }
  if (data.dueDay !== undefined && (!Number.isInteger(data.dueDay) || (data.dueDay as number) < 1 || (data.dueDay as number) > 28)) {
    return res.status(400).json({ error: 'O vencimento deve estar entre os dias 1 e 28.' });
  }

  const updated = await prisma.membership.update({ where: { id: membership.id }, data });
  await createLog(req.user!.id, req.user!.name, 'Editou', 'Mensalidade', `Editou a mensalidade de ${membership.user.name}`);
  res.json(updated);
});

router.post('/admin/memberships/:id/payments', authorize('membership'), async (req, res) => {
  const membership = await prisma.membership.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!membership) return res.status(404).json({ error: 'Mensalidade não encontrada.' });

  const referenceMonth = String(req.body.referenceMonth || monthKey());
  if (!/^\d{4}-\d{2}$/.test(referenceMonth)) return res.status(400).json({ error: 'Mês de referência inválido.' });

  const payment = await prisma.membershipPayment.upsert({
    where: { membershipId_referenceMonth: { membershipId: membership.id, referenceMonth } },
    create: {
      membershipId: membership.id,
      referenceMonth,
      amountCents: Number(req.body.amountCents || membership.monthlyAmountCents),
      dueDate: dueDateForMonth(referenceMonth, membership.dueDay),
      paidAt: new Date().toISOString(),
      method: String(req.body.method || 'manual'),
      status: 'paid',
      notes: req.body.notes ? String(req.body.notes) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    update: {
      amountCents: Number(req.body.amountCents || membership.monthlyAmountCents),
      paidAt: new Date().toISOString(),
      method: String(req.body.method || 'manual'),
      status: 'paid',
      notes: req.body.notes ? String(req.body.notes) : null,
      updatedAt: new Date().toISOString(),
    },
  });
  await createLog(req.user!.id, req.user!.name, 'Registrou', 'Pagamento', `Registrou pagamento de ${membership.user.name} referente a ${referenceMonth}`);
  res.json({ ...payment, status: 'paid' });
});

export default router;
