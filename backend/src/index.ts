import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './middleware/security';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import eventsRoutes from './routes/events.routes';
import faqRoutes from './routes/faq.routes';
import newsRoutes from './routes/news.routes';
import galleryRoutes from './routes/gallery.routes';
import servicesRoutes from './routes/services.routes';
import entitiesRoutes from './routes/entities.routes';
import configRoutes from './routes/config.routes';
import messagesRoutes from './routes/messages.routes';
import logsRoutes from './routes/logs.routes';
import importRoutes from './routes/import.routes';
import publicRoutes from './routes/public.routes';
import confirmationsRoutes from './routes/confirmations.routes';
import membershipRoutes from './routes/membership.routes';
import asaasWebhookRoutes from './routes/asaas-webhook.routes';
import appointmentsRoutes from './routes/appointments.routes';
import purchasesRoutes from './routes/purchases.routes';
import attendanceRoutes from './routes/attendance.routes';
import preRegistrationsRoutes from './routes/pre-registrations.routes';
import { uploadsRouter, imagesRouter } from './routes/uploads.routes';

const app = express();

// Railway/Vercel ficam atrás de proxy. Isso permite que os limitadores usem o IP real.
app.set('trust proxy', 1);

// Cabeçalhos HTTP de segurança (CSP não é forçada aqui para não quebrar imagens/recursos externos existentes).
app.use(helmet({ contentSecurityPolicy: false }));
app.use(apiLimiter);

// A lista de domínios liberados vem de uma variável de ambiente.
// Isso é o que permite trocar de domínio/hospedagem no futuro sem tocar no código:
// basta atualizar FRONTEND_URL no painel da hospedagem.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Permite chamadas sem "origin" (ex: apps mobile, curl, health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origem não autorizada pelo CORS.'));
      }
    },
  })
);

// Limite maior no corpo da requisição pois imagens podem ser enviadas em base64.
app.use(express.json({ limit: '8mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', confirmationsRoutes);
app.use('/api', membershipRoutes);
app.use('/api', asaasWebhookRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/admin/events', eventsRoutes);
app.use('/api/admin/faq', faqRoutes);
app.use('/api/admin/news', newsRoutes);
app.use('/api/admin/gallery', galleryRoutes);
app.use('/api/admin/services', servicesRoutes);
app.use('/api/admin/entities', entitiesRoutes);
app.use('/api/admin/config', configRoutes);
app.use('/api/admin/messages', messagesRoutes);
app.use('/api/admin/logs', logsRoutes);
app.use('/api/admin/import', importRoutes);
app.use('/api/admin/appointments', appointmentsRoutes);
app.use('/api/admin/purchases', purchasesRoutes);
app.use('/api/admin/pre-registrations', preRegistrationsRoutes);
app.use('/api', attendanceRoutes);
app.use('/api/admin/uploads', uploadsRouter);
app.use('/api/images', imagesRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = Number(process.env.PORT) || 3333;
app.listen(PORT, () => {
  console.log(`API do terreiro rodando na porta ${PORT}`);
});
