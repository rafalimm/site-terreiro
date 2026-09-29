import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Um único endpoint que devolve tudo o que as páginas públicas do site precisam
// de uma vez só (evita várias requisições separadas a cada carregamento de página).
router.get('/bundle', async (_req, res) => {
  const [events, faqItems, newsItems, galleryItems, services, entities, entityLines, siteConfig] = await Promise.all([
    prisma.giraEvent.findMany({ where: { isPublic: true }, orderBy: { date: 'asc' } }),
    prisma.fAQItem.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.newsItem.findMany({ where: { active: true }, orderBy: { publishedAt: 'desc' } }),
    prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.serviceInfo.findMany(),
    prisma.entity.findMany({ where: { active: true }, include: { lineCategory: true } }),
    prisma.entityLine.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.siteConfig.findUnique({ where: { id: 1 } }),
  ]);
  res.json({ events, faqItems, newsItems, galleryItems, services, entities, entityLines, siteConfig });
});

// Giras de Desenvolvimento são exclusivas para usuários com cargo Filho.
router.get('/filho/desenvolvimento', authenticate, authorize('filho_content'), async (_req, res) => {
  const events = await prisma.giraEvent.findMany({
    where: { type: 'Gira de Desenvolvimento', isPublic: false },
    orderBy: { date: 'asc' },
  });
  res.json(events);
});

// POST /api/public/contact — formulário de contato do site, sem necessidade de login
router.post('/contact', async (req, res) => {
  const { name, whatsapp, email, subject, message } = req.body ?? {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
  }
  const msg = await prisma.contactMessage.create({
    data: {
      name,
      whatsapp: whatsapp || '',
      email,
      subject: subject || '',
      message,
      receivedAt: new Date().toISOString(),
      read: false,
    },
  });
  res.status(201).json(msg);
});

// POST /api/public/appointments — pedido de agendamento (búzios, cartas ou consulta), sem login
router.post('/appointments', async (req, res) => {
  const { name, whatsapp, email, type, preferredDate, preferredTime, notes } = req.body ?? {};
  if (!name || !whatsapp || !type || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
  }
  try {
    const appointment = await prisma.appointment.create({
      data: {
        name,
        whatsapp,
        email: email || null,
        type,
        preferredDate: String(preferredDate).slice(0, 10),
        preferredTime,
        notes: notes || '',
        status: 'pendente',
        createdAt: new Date().toISOString(),
      },
    });
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    res.status(500).json({ error: 'Não foi possível registrar seu agendamento.' });
  }
});

export default router;
