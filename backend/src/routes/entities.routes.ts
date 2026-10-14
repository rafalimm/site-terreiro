import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { createLog } from '../utils/log';
import { toRelativeImageUrl, deleteUploadedImage, uploadedImageId } from '../utils/images';

const router = Router();
router.use(authenticate, authorize('entities'));

router.get('/lines', async (_req, res) => {
  const lines = await prisma.entityLine.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    include: { members: { where: { active: true }, include: { lineCategory: true } } },
  });
  res.json(lines);
});

router.post('/lines', async (req, res) => {
  try {
    const { name, description = '', entityIds = [] } = req.body ?? {};
    if (!name?.trim()) return res.status(400).json({ error: 'Informe o nome da linha.' });
    const ids = Array.isArray(entityIds) ? [...new Set(entityIds.filter(Boolean))] : [];
    const lineId = `linha-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Cria a categoria primeiro. As entidades são vinculadas depois, permitindo
    // misturar entidades de várias linhas (ex.: Caboclos + Baianos + Boiadeiros).
    const line = await prisma.entityLine.create({
      data: {
        id: lineId,
        name: name.trim(),
        description: String(description),
        sortOrder: 1000,
      },
    });
    if (ids.length > 0) {
      await prisma.entityLine.update({
        where: { id: line.id },
        data: { members: { connect: ids.map((id: string) => ({ id })) } },
      });
    }
    const savedLine = await prisma.entityLine.findUnique({
      where: { id: line.id },
      include: { members: { include: { lineCategory: true } } },
    });
    if (!savedLine) throw new Error('Linha criada, mas não foi possível carregá-la.');
    // A criação da linha não deve falhar caso o registro de auditoria tenha algum problema.
    try {
      await createLog(req.user!.id, req.user!.name, 'Criou', 'Linha', `Criou a linha "${savedLine.name}"`);
    } catch (logError) {
      console.error('Linha criada, mas não foi possível registrar o log:', logError);
    }
    res.status(201).json(savedLine);
  } catch (error: any) {
    console.error('Erro ao criar linha:', error);
    const message = error?.code === 'P2002'
      ? 'Já existe uma linha com esse nome.'
      : 'Não foi possível criar a linha.';
    res.status(400).json({ error: message });
  }
});

router.patch('/lines/:id', async (req, res) => {
  try {
    const { name, description, entityIds } = req.body ?? {};
    const data: any = {};
    if (typeof name === 'string') data.name = name.trim();
    if (typeof description === 'string') data.description = description;
    if (Array.isArray(entityIds)) data.members = { set: entityIds.filter(Boolean).map((id: string) => ({ id })) };
    const line = await prisma.entityLine.update({
      where: { id: req.params.id },
      data,
      include: { members: { include: { lineCategory: true } } },
    });
    await createLog(req.user!.id, req.user!.name, 'Editou', 'Linha', `Editou a linha "${line.name}"`);
    res.json(line);
  } catch (error) {
    console.error('Erro ao editar linha:', error);
    res.status(400).json({ error: 'Não foi possível editar a linha.' });
  }
});

router.delete('/lines/:id', async (req, res) => {
  try {
    const line = await prisma.entityLine.delete({ where: { id: req.params.id } });
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Linha', `Excluiu a linha "${line.name}"`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Linha não encontrada.' });
  }
});

router.get('/', async (_req, res) => {
  res.json(await prisma.entity.findMany({
    include: {
      lineCategory: true,
      owner: { select: { id: true, name: true, role: true, active: true } },
    },
  }));
});

router.post('/', async (req, res) => {
  try {
    const body = req.body ?? {};
    const { lineId, ownerId } = body;
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 160) : '';
    if (!name) return res.status(400).json({ error: 'Informe o nome da entidade.' });

    const lineCategory = await prisma.entityLine.findFirst({ where: { id: lineId, active: true } });
    if (!lineCategory) return res.status(400).json({ error: 'Selecione uma linha válida.' });
    if (ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: String(ownerId) }, select: { id: true, role: true } });
      if (!owner || owner.role === 'consulente') return res.status(400).json({ error: 'Somente usuários com cargo acima de consulente podem ser responsáveis por uma entidade.' });
    }
    const entity = await prisma.entity.create({
      data: {
        name,
        ownerId: ownerId || null,
        line: lineCategory.name,
        lineId: lineCategory.id,
        description: typeof body.description === 'string' ? body.description.slice(0, 5000) : '',
        image: toRelativeImageUrl(body.image) || null,
        history: typeof body.history === 'string' ? body.history.slice(0, 10000) : '',
        characteristics: typeof body.characteristics === 'string' ? body.characteristics.slice(0, 5000) : '',
        additionalInfo: typeof body.additionalInfo === 'string' ? body.additionalInfo.slice(0, 5000) : '',
        active: typeof body.active === 'boolean' ? body.active : true,
      },
      include: { lineCategory: true, owner: { select: { id: true, name: true, role: true, active: true } } },
    });
    await createLog(req.user!.id, req.user!.name, 'Criou', 'Entidade', `Criou a entidade "${entity.name}"`);
    res.status(201).json(entity);
  } catch (error) {
    console.error('Erro ao criar entidade:', error);
    res.status(400).json({ error: 'Não foi possível criar a entidade. Selecione uma linha válida.' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const body = req.body ?? {};
    const data: Record<string, any> = {};

    // Atualiza somente os campos que a tela de entidades realmente gerencia.
    if (typeof body.name === 'string') data.name = body.name.trim().slice(0, 160);
    if (typeof body.line === 'string') data.line = body.line.trim().slice(0, 120);
    if (typeof body.description === 'string') data.description = body.description.slice(0, 5000);
    if (typeof body.history === 'string') data.history = body.history.slice(0, 10000);
    if (typeof body.characteristics === 'string') data.characteristics = body.characteristics.slice(0, 5000);
    if (typeof body.additionalInfo === 'string') data.additionalInfo = body.additionalInfo.slice(0, 5000);
    if (typeof body.active === 'boolean') data.active = body.active;
    if (typeof body.ownerId === 'string' || body.ownerId === null) data.ownerId = body.ownerId;
    if (typeof body.lineId === 'string') data.lineId = body.lineId;
    if (typeof body.image === 'string' || body.image === null) data.image = body.image;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });
    }

    if ('ownerId' in data) {
      if (data.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: String(data.ownerId) }, select: { id: true, role: true } });
        if (!owner || owner.role === 'consulente') return res.status(400).json({ error: 'Somente usuários com cargo acima de consulente podem ser responsáveis por uma entidade.' });
        data.ownerId = owner.id;
      } else data.ownerId = null;
    }

    if ('lineId' in data) {
      const lineCategory = await prisma.entityLine.findFirst({
        where: { id: data.lineId, active: true },
      });
      if (!lineCategory) {
        return res.status(400).json({ error: 'Selecione uma linha válida.' });
      }
      data.lineId = lineCategory.id;
      data.line = lineCategory.name;
    }

    if ('image' in data) {
      data.image = toRelativeImageUrl(data.image) || null;
    }

    const before = await prisma.entity.findUnique({
      where: { id: req.params.id },
    });

    const entity = await prisma.entity.update({
      where: { id: req.params.id },
      data,
      include: { lineCategory: true, owner: { select: { id: true, name: true, role: true, active: true } } },
    });

    if (before && uploadedImageId(before.image) && before.image !== entity.image) {
      await deleteUploadedImage(before.image);
    }

    await createLog(
      req.user!.id,
      req.user!.name,
      'Editou',
      'Entidade',
      `Editou a entidade "${entity.name}"`,
    );

    return res.json(entity);
  } catch (error) {
    console.error('Erro ao editar entidade:', error);
    return res.status(404).json({ error: 'Entidade não encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entity = await prisma.entity.delete({ where: { id: req.params.id } });
    await deleteUploadedImage(entity.image);
    await createLog(req.user!.id, req.user!.name, 'Excluiu', 'Entidade', `Excluiu a entidade "${entity.name}"`);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Entidade não encontrada.' });
  }
});

export default router;
