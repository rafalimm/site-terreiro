import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();
router.use(authenticate, authorize('agenda', 'events'));

router.get('/', async (_req, res) => {
  const appointments = await prisma.appointment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(appointments);
});

router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body ?? {};
    const appointment = await prisma.appointment.update({ where: { id: req.params.id }, data: { status } });
    try {
      await createLog(req.user!.id, req.user!.name, 'Atualizou', 'Agendamento', `Marcou o agendamento de ${appointment.name} como "${status}"`);
    } catch (logError) {
      console.error('Falha ao registrar log do agendamento:', logError);
    }
    res.json(appointment);
  } catch {
    res.status(404).json({ error: 'Agendamento não encontrado.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.delete({ where: { id: req.params.id } });
    try {
      await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Agendamento', `Excluiu o agendamento de ${appointment.name}`);
    } catch (logError) {
      console.error('Falha ao registrar log do agendamento:', logError);
    }
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Agendamento não encontrado.' });
  }
});

export default router;
