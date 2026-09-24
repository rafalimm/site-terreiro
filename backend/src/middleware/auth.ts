import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/jwt';
import { hasPermission, UserRole } from '../utils/permissions';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Confere se existe um token válido no header Authorization e carrega o usuário atual.
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário inválido ou inativo.' });
    }
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role as UserRole };
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
}

// Exige que o cargo do usuário tenha pelo menos uma das permissões informadas.
export function authorize(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    const allowed = permissions.some(p => hasPermission(req.user!.role, p));
    if (!allowed) return res.status(403).json({ error: 'Você não tem permissão para realizar essa ação.' });
    next();
  };
}

// Algumas ações (gerenciar usuários e cargos, ver logs) são exclusivas do Super Administrador.
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Apenas o Super Administrador pode realizar essa ação.' });
  }
  next();
}
