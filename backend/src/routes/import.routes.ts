import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireSuperAdmin);

/**
 * POST /api/admin/import
 *
 * Ferramenta de migração única: recebe o mesmo formato de dados que hoje fica
 * salvo no localStorage do navegador (veja o botão "Exportar dados locais" em
 * Admin > Configurações no front-end) e grava tudo no banco de dados real.
 *
 * É seguro rodar mais de uma vez: usuários são identificados por e-mail
 * (não duplica), o restante é sempre inserido como novo registro.
 * Use isso UMA vez, logo depois de colocar o backend no ar, para trazer
 * o conteúdo que já existia no site antigo.
 */
router.post('/', async (req, res) => {
  const {
    users = [],
    events = [],
    faqItems = [],
    newsItems = [],
    galleryItems = [],
    services = [],
    entities = [],
    siteConfig,
    contactMessages = [],
  } = req.body ?? {};

  const result = { users: 0, events: 0, faqItems: 0, newsItems: 0, galleryItems: 0, services: 0, entities: 0, contactMessages: 0, siteConfig: false };

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: String(u.email).toLowerCase() } });
    if (existing) continue;
    // A senha vinda do localStorage antigo está em texto puro — é hasheada aqui na migração.
    const hashed = await bcrypt.hash(u.password || Math.random().toString(36).slice(2), 10);
    await prisma.user.create({
      data: {
        name: u.name,
        email: String(u.email).toLowerCase(),
        password: hashed,
        role: u.role || 'consulente',
        whatsapp: u.whatsapp || null,
        active: u.active ?? true,
        createdAt: u.createdAt || new Date().toISOString(),
      },
    });
    result.users++;
  }

  for (const e of events) {
    await prisma.giraEvent.create({
      data: {
        title: e.title, date: e.date, time: e.time, type: e.type, description: e.description || '',
        orientation: e.orientation || '', isPublic: e.isPublic ?? true, requiresScheduling: e.requiresScheduling ?? false,
        observations: e.observations || '', createdBy: e.createdBy || 'Migração', createdAt: e.createdAt || new Date().toISOString(),
      },
    });
    result.events++;
  }

  for (const f of faqItems) {
    await prisma.fAQItem.create({ data: { question: f.question, answer: f.answer, order: f.order ?? 0, active: f.active ?? true } });
    result.faqItems++;
  }

  for (const n of newsItems) {
    await prisma.newsItem.create({
      data: { title: n.title, content: n.content, image: n.image || null, category: n.category || '', author: n.author || '', publishedAt: n.publishedAt || new Date().toISOString(), active: n.active ?? true },
    });
    result.newsItems++;
  }

  for (const g of galleryItems) {
    await prisma.galleryItem.create({
      data: { url: g.url, title: g.title || '', description: g.description || '', category: g.category || '', isMain: g.isMain ?? false, createdAt: g.createdAt || new Date().toISOString() },
    });
    result.galleryItems++;
  }

  for (const s of services) {
    const existing = await prisma.serviceInfo.findFirst({ where: { type: s.type } });
    if (existing) {
      await prisma.serviceInfo.update({ where: { id: existing.id }, data: s });
    } else {
      await prisma.serviceInfo.create({ data: s });
    }
    result.services++;
  }

  for (const ent of entities) {
    await prisma.entity.create({
      data: {
        name: ent.name, line: ent.line || '', description: ent.description || '', image: ent.image || null,
        history: ent.history || '', characteristics: ent.characteristics || '', additionalInfo: ent.additionalInfo || '', active: ent.active ?? true,
      },
    });
    result.entities++;
  }

  for (const m of contactMessages) {
    await prisma.contactMessage.create({
      data: { name: m.name, whatsapp: m.whatsapp || '', email: m.email, subject: m.subject || '', message: m.message, receivedAt: m.receivedAt || new Date().toISOString(), read: m.read ?? false },
    });
    result.contactMessages++;
  }

  if (siteConfig) {
    await prisma.siteConfig.upsert({ where: { id: 1 }, update: siteConfig, create: { id: 1, ...siteConfig } });
    result.siteConfig = true;
  }

  res.json({ message: 'Importação concluída.', result });
});

export default router;
