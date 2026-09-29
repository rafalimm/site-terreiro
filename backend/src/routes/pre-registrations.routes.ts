import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('pre_cadastro'));

const normalizeCpf = (value: unknown) => String(value || '').replace(/\D/g, '');

router.get('/', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { preRegisteredAt: { not: null } },
      orderBy: { preRegisteredAt: 'desc' },
      select: {
        id: true, name: true, cpfCnpj: true, email: true, whatsapp: true,
        registrationCompleted: true, preRegisteredAt: true, registrationCompletedAt: true,
        attendances: {
          orderBy: { confirmedAt: 'desc' },
          take: 1,
          select: {
            queueNumber: true, qrToken: true, status: true,
            event: { select: { id: true, title: true, date: true, time: true } },
          },
        },
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar pré-cadastros:', error);
    res.status(500).json({ error: 'Não foi possível carregar os pré-cadastros.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const cpf = normalizeCpf(req.body?.cpf);
    const eventId = String(req.body?.eventId || '');

    if (!name) return res.status(400).json({ error: 'Informe o nome completo.' });
    if (cpf.length !== 11) return res.status(400).json({ error: 'Informe um CPF válido.' });
    if (!eventId) return res.status(400).json({ error: 'Selecione a gira.' });

    const event = await prisma.giraEvent.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Gira não encontrada.' });

    const existing = await prisma.user.findFirst({ where: { cpfCnpj: cpf } });
    if (existing) {
      if (existing.registrationCompleted === false) {
        return res.status(409).json({ error: 'Este CPF já possui um pré-cadastro pendente.' });
      }
      return res.status(409).json({ error: 'Este CPF já pertence a uma conta cadastrada.' });
    }

    const last = await prisma.giraAttendance.findFirst({
      where: { eventId, queueNumber: { not: null } },
      orderBy: { queueNumber: 'desc' },
      select: { queueNumber: true },
    });
    const queueNumber = (last?.queueNumber ?? 0) + 1;
    const now = new Date().toISOString();

    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          name,
          email: null,
          password: null,
          cpfCnpj: cpf,
          role: 'consulente',
          active: true,
          registrationCompleted: false,
          preRegisteredAt: now,
          createdAt: now,
        },
      });

      const attendance = await tx.giraAttendance.create({
        data: {
          eventId,
          userId: user.id,
          qrToken: randomUUID(),
          queueNumber,
          status: 'arrived',
          isFirstVisit: true,
          confirmedAt: now,
          checkedInAt: now,
          updatedAt: now,
        },
        include: {
          event: { select: { id: true, title: true, date: true, time: true } },
          user: { select: { id: true, name: true, cpfCnpj: true } },
        },
      });

      return { user, attendance };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar pré-cadastro:', error);
    res.status(409).json({ error: 'Não foi possível criar o pré-cadastro. Verifique se o CPF ou a senha já foram utilizados.' });
  }
});

export default router;
