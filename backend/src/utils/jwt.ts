import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  // Segredo fraco ou ausente deve impedir o servidor de emitir/aceitar sessões.
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET ausente ou muito curto. Configure um segredo aleatório de pelo menos 32 caracteres.');
  }
  return secret;
}

export function signToken(payload: TokenPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId: payload.userId, role: payload.role }, getSecret(), {
    expiresIn,
    algorithm: 'HS256',
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  if (
    typeof decoded === 'string' ||
    typeof decoded.userId !== 'string' ||
    decoded.userId.length === 0 ||
    typeof decoded.role !== 'string'
  ) {
    throw new Error('Token de sessão inválido.');
  }
  return { userId: decoded.userId, role: decoded.role };
}
