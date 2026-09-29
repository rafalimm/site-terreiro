import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { contactLimiter, appointmentLimiter } from '../middleware/security';

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
    prisma.entityLine.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, include: { members: { where: { active: true }, include: { lineCategory: true } } } }),
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
router.post('/contact', contactLimiter, async (req, res) => {
  const { name, whatsapp, email, subject, message } = req.body ?? {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanWhatsapp = String(whatsapp || '').trim();
  const cleanSubject = String(subject || '').trim();
  const cleanMessage = String(message || '').trim();
  if (!cleanName || !cleanEmail || !cleanMessage) {
    return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
  }
  if (cleanName.length > 120 || cleanEmail.length > 254 || cleanWhatsapp.length > 30 || cleanSubject.length > 120 || cleanMessage.length > 4000) {
    return res.status(400).json({ error: 'Um ou mais campos excedem o tamanho permitido.' });
  }
  const msg = await prisma.contactMessage.create({
    data: {
      name: cleanName,
      whatsapp: cleanWhatsapp,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      receivedAt: new Date().toISOString(),
      read: false,
    },
  });
  res.status(201).json(msg);
});

// POST /api/public/appointments — pedido de agendamento (búzios, cartas ou consulta), sem login
router.post('/appointments', appointmentLimiter, async (req, res) => {
  const { name, whatsapp, email, type, preferredDate, preferredTime, notes } = req.body ?? {};
  const cleanName = String(name || '').trim();
  const cleanWhatsapp = String(whatsapp || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanType = String(type || '').trim();
  const cleanNotes = String(notes || '').trim();
  if (!cleanName || !cleanWhatsapp || !cleanType || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'Preencha os campos obrigatórios.' });
  }
  if (cleanName.length > 120 || cleanWhatsapp.length > 30 || cleanEmail.length > 254 || cleanType.length > 60 || cleanNotes.length > 2000) {
    return res.status(400).json({ error: 'Um ou mais campos excedem o tamanho permitido.' });
  }
  try {
    const appointment = await prisma.appointment.create({
      data: {
        name: cleanName,
        whatsapp: cleanWhatsapp,
        email: cleanEmail || null,
        type: cleanType,
        preferredDate: String(preferredDate).slice(0, 10),
        preferredTime: String(preferredTime).slice(0, 20),
        notes: cleanNotes,
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
