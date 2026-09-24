import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Super Administrador inicial — TROQUE A SENHA assim que fizer o primeiro login em produção.
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@zedolaco.com.br';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: 'Super Administrador',
        email,
        password: await bcrypt.hash(password, 10),
        role: 'super_admin',
        active: true,
        createdAt: new Date().toISOString(),
      },
    });
    console.log(`Super Administrador criado: ${email} / senha: ${password} (troque depois de logar!)`);
  } else {
    console.log('Super Administrador já existe, pulando criação.');
  }

  // Linha única de configurações do site, com valores padrão caso ainda não exista.
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      heroTitle: 'Terreiro Zé do Laço',
      heroSubtitle: 'Umbanda, fé e caridade',
      aboutText: 'Edite este texto em Admin > Configurações.',
      aboutHistory: 'Edite a história do terreiro em Admin > Configurações.',
      whatsapp: '',
      instagram: '',
      address: '',
      mapUrl: '',
      email: '',
      workingHours: '',
      heroImage: '/images/hero-bg.jpg',
      aboutImage: '/images/about-bg.jpg',
    },
  });

  // Os dois tipos de serviço fixos usados nas páginas de Búzios/Cartas.
  const servicesSeed = [
    { type: 'buzios', title: 'Jogo de Búzios', description: '', howItWorks: '', duration: '', orientation: '', requiresScheduling: true },
    { type: 'cards', title: 'Jogo de Cartas', description: '', howItWorks: '', duration: '', orientation: '', requiresScheduling: true },
  ];
  for (const s of servicesSeed) {
    const existingService = await prisma.serviceInfo.findFirst({ where: { type: s.type } });
    if (!existingService) await prisma.serviceInfo.create({ data: s });
  }

  console.log('Seed concluído. Use a ferramenta de importação (POST /api/admin/import) para trazer o');
  console.log('restante do conteúdo (FAQ, notícias, galeria, entidades) que já existia no site antigo.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
