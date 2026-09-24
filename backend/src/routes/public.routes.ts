import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Um único endpoint que devolve tudo o que as páginas públicas do site precisam
// de uma vez só (evita várias requisições separadas a cada carregamento de página).
router.get('/bundle', async (_req, res) => {
  const [events, faqItems, newsItems, galleryItems, services, entities, siteConfig] = await Promise.all([
    prisma.giraEvent.findMany({ where: { isPublic: true }, orderBy: { date: 'asc' } }),
    prisma.fAQItem.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.newsItem.findMany({ where: { active: true }, orderBy: { publishedAt: 'desc' } }),
    prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.serviceInfo.findMany(),
    prisma.entity.findMany({ where: { active: true } }),
    prisma.siteConfig.findUnique({ where: { id: 1 } }),
  ]);
  res.json({ events, faqItems, newsItems, galleryItems, services, entities, siteConfig });
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

export default router;
