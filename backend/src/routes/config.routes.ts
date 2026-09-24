import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('institutional'));

router.get('/', async (_req, res) => {
  const config = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  res.json(config);
});

router.patch('/', async (req, res) => {
  const data = { ...req.body };
  delete data.id;
  const config = await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  await createLog(req.user!.id, req.user!.name, 'Editou', 'Configurações', 'Alterou as configurações do site');
  res.json(config);
});

export default router;
