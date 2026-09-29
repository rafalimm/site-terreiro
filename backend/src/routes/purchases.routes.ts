import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';

const router = Router();

router.use(authenticate);

router.get('/', authorize('compras'), async (_req, res) => {
  const items = await prisma.purchaseItem.findMany({
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
  });
  res.json(items);
});

router.post('/', authorize('compras'), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const quantity = String(req.body.quantity || '').trim();
    const unit = req.body.unit ? String(req.body.unit).trim() : null;
    const category = req.body.category ? String(req.body.category).trim() : null;
    const priority = ['low', 'normal', 'high', 'urgent'].includes(String(req.body.priority))
      ? String(req.body.priority)
      : 'normal';
    const notes = String(req.body.notes || '').trim();

    if (!name || !quantity) {
      return res.status(400).json({ error: 'Nome do item e quantidade são obrigatórios.' });
    }

    const now = new Date().toISOString();
    const item = await prisma.purchaseItem.create({
      data: {
        name,
        quantity,
        unit,
        category,
        priority,
        notes,
        status: 'pending',
        createdBy: req.user!.name,
        createdAt: now,
        updatedAt: now,
      },
    });

    await createLog(req.user!.id, req.user!.name, 'Adicionou', 'Compras', `Adicionou o item "${name}" à lista de compras`);
    res.status(201).json(item);
  } catch (error) {
    console.error('Erro ao adicionar item de compra:', error);
    res.status(500).json({ error: 'Não foi possível adicionar o item.' });
  }
});

router.patch('/:id', authorize('compras'), async (req, res) => {
  try {
    const existing = await prisma.purchaseItem.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Item de compra não encontrado.' });

    const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.quantity !== undefined) data.quantity = String(req.body.quantity).trim();
    if (req.body.unit !== undefined) data.unit = req.body.unit ? String(req.body.unit).trim() : null;
    if (req.body.category !== undefined) data.category = req.body.category ? String(req.body.category).trim() : null;
    if (req.body.notes !== undefined) data.notes = String(req.body.notes).trim();
    if (req.body.priority !== undefined && ['low', 'normal', 'high', 'urgent'].includes(String(req.body.priority))) {
      data.priority = String(req.body.priority);
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status);
      if (!['pending', 'purchased'].includes(status)) {
        return res.status(400).json({ error: 'Status de compra inválido.' });
      }
      data.status = status;
      if (status === 'purchased') {
        data.purchasedBy = req.user!.name;
        data.purchasedAt = new Date().toISOString();
      } else {
        data.purchasedBy = null;
        data.purchasedAt = null;
      }
    }

    const item = await prisma.purchaseItem.update({ where: { id: existing.id }, data });
    await createLog(req.user!.id, req.user!.name, req.body.status === 'purchased' ? 'Confirmou' : 'Editou', 'Compras', `Atualizou o item "${item.name}"`);
    res.json(item);
  } catch (error) {
    console.error('Erro ao atualizar item de compra:', error);
    res.status(500).json({ error: 'Não foi possível atualizar o item.' });
  }
});

router.delete('/:id', authorize('compras'), async (req, res) => {
  try {
    const item = await prisma.purchaseItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item de compra não encontrado.' });

    await prisma.purchaseItem.delete({ where: { id: item.id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Compras', `Removeu o item "${item.name}" da lista de compras`);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir item de compra:', error);
    res.status(500).json({ error: 'Não foi possível excluir o item.' });
  }
});

export default router;
