import rateLimit from 'express-rate-limit';

const common = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: any, res: any) => {
    res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
  },
};

export const apiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 600,
});

export const loginLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
});

export const registerLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { error: 'Muitas tentativas de cadastro. Aguarde e tente novamente mais tarde.' },
});

export const preLookupLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 15,
});

export const preCompleteLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

export const contactLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

export const appointmentLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});
