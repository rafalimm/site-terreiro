import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { uploadToSupabaseStorage } from '../storage/supabaseStorage';

async function main() {
  const legacy = await prisma.uploadedFile.findMany({
    where: { storagePath: null, data: { not: null } },
    select: { id: true, mimeType: true, originalName: true, size: true, data: true },
  });

  console.log(`Arquivos antigos encontrados: ${legacy.length}`);

  for (const file of legacy) {
    if (!file.data) continue;
    const stored = await uploadToSupabaseStorage(Buffer.from(file.data), file.mimeType, file.originalName);
    await prisma.uploadedFile.update({
      where: { id: file.id },
      data: { storagePath: stored.path, data: null },
    });
    console.log(`Migrado: ${file.originalName}`);
  }

  console.log('Migração concluída.');
}

main()
  .catch(error => {
    console.error('Falha na migração:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
