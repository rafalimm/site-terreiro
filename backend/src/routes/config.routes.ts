import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('institutional'));

const CONFIG_FIELD_LIMITS: Record<string, number> = {
  heroTitle: 160,
  heroSubtitle: 2000,
  aboutText: 10000,
  aboutHistory: 10000,
  whatsapp: 30,
  instagram: 500,
  address: 500,
  mapUrl: 2000,
  email: 254,
  workingHours: 2000,
  heroImage: 5000,
  aboutImage: 5000,
};

router.get('/', async (_req, res) => {
  const config = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  res.json(config);
});

router.patch('/', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Envie configurações válidas.' });
  }

  // Lista permitida: não aceitar id ou campos internos/inesperados vindos do cliente.
  const data: Partial<Record<keyof typeof CONFIG_FIELD_LIMITS, string>> = {};
  for (const [field, maxLength] of Object.entries(CONFIG_FIELD_LIMITS)) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== 'string') {
      return res.status(400).json({ error: `O campo "${field}" deve ser texto.` });
    }
    const value = body[field].trim();
    if (value.length > maxLength) {
      return res.status(400).json({ error: `O campo "${field}" excede o limite permitido.` });
    }
    data[field] = field === 'whatsapp' ? value.replace(/\D/g, '') : value;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo de configuração válido para atualizar.' });
  }

  const existing = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (existing) {
    const config = await prisma.siteConfig.update({ where: { id: 1 }, data });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Configurações', 'Alterou as configurações do site');
    return res.json(config);
  }

  const requiredFields = ['heroTitle', 'heroSubtitle', 'aboutText', 'aboutHistory', 'whatsapp', 'instagram', 'address', 'mapUrl', 'email', 'workingHours', 'heroImage', 'aboutImage'];
  if (requiredFields.some(field => typeof data[field] !== 'string')) {
    return res.status(400).json({ error: 'A configuração inicial do site está incompleta. Preencha todos os campos antes de salvar.' });
  }

  const config = await prisma.siteConfig.create({ data: { id: 1, ...data } as any });
  await createLog(req.user!.id, req.user!.name, 'Criou', 'Configurações', 'Criou as configurações do site');
  return res.status(201).json(config);
});

export default router;
