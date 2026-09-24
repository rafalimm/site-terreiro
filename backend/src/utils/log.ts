import { prisma } from '../lib/prisma';

export async function createLog(userId: string, userName: string, action: string, entity: string, details: string) {
  try {
    await prisma.activityLog.create({
      data: { userId, userName, action, entity, details, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    // Um log que falha não deve nunca derrubar a operação principal.
    console.error('Falha ao registrar log de atividade:', err);
  }
}
