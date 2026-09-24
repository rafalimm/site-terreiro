import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireSuperAdmin);

router.get('/', async (_req, res) => {
  const logs = await prisma.activityLog.findMany({ orderBy: { timestamp: 'desc' }, take: 200 });
  res.json(logs);
});

export default router;
