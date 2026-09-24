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
    update: {
      heroTitle: 'Centro de Umbanda Zé do Laço',
      heroSubtitle: 'Terreiro, templo, jogo de cartas e búzios',
      aboutText: 'O Centro de Umbanda Zé do Laço é um terreiro e templo dedicado à espiritualidade, à fé, ao acolhimento e à prática da Umbanda, oferecendo um espaço de respeito, orientação e conexão com a espiritualidade.',
      aboutHistory: 'Nossa casa busca acolher cada consulente com respeito, fé, caridade e dedicação. Além dos trabalhos e atendimentos espirituais, o Centro também realiza consultas de Jogo de Búzios e Jogo de Cartas, conforme a tradição e a orientação da casa.',
      whatsapp: '5511940087119',
      instagram: 'centrodeumbandazedolaco',
      address: 'Av. Santo Amaro, 5914 - Subsolo - Santo Amaro, São Paulo - SP, 04702-001',
      mapUrl: 'https://www.google.com/maps/place/CENTRO+DE+UMBANDA+Z%C3%89+DO+LA%C3%87O+-+TERREIRO,+TEMPLO,+JOGO+DE+CARTAS+E+B%C3%9AZIOS/@-23.6336119,-46.696157,16z/data=!3m1!4b1!4m6!3m5!1s0x94ce51ffbd384009:0xcc7dbb253d8db947!8m2!3d-23.6336168!4d-46.6935821!16s%2Fg%2F11sd_57m9v',
      email: '',
      workingHours: 'Consulte os dias e horários de atendimento e agendamento pelo WhatsApp.',
      heroImage: '/images/hero-bg.jpg',
      aboutImage: '/images/about-bg.jpg',
    },
    create: {
      id: 1,
      heroTitle: 'Centro de Umbanda Zé do Laço',
      heroSubtitle: 'Terreiro, templo, jogo de cartas e búzios',
      aboutText: 'O Centro de Umbanda Zé do Laço é um terreiro e templo dedicado à espiritualidade, à fé, ao acolhimento e à prática da Umbanda, oferecendo um espaço de respeito, orientação e conexão com a espiritualidade.',
      aboutHistory: 'Nossa casa busca acolher cada consulente com respeito, fé, caridade e dedicação. Além dos trabalhos e atendimentos espirituais, o Centro também realiza consultas de Jogo de Búzios e Jogo de Cartas, conforme a tradição e a orientação da casa.',
      whatsapp: '5511940087119',
      instagram: 'centrodeumbandazedolaco',
      address: 'Av. Santo Amaro, 5914 - Subsolo - Santo Amaro, São Paulo - SP, 04702-001',
      mapUrl: 'https://www.google.com/maps/place/CENTRO+DE+UMBANDA+Z%C3%89+DO+LA%C3%87O+-+TERREIRO,+TEMPLO,+JOGO+DE+CARTAS+E+B%C3%9AZIOS/@-23.6336119,-46.696157,16z/data=!3m1!4b1!4m6!3m5!1s0x94ce51ffbd384009:0xcc7dbb253d8db947!8m2!3d-23.6336168!4d-46.6935821!16s%2Fg%2F11sd_57m9v',
      email: '',
      workingHours: 'Consulte os dias e horários de atendimento e agendamento pelo WhatsApp.',
      heroImage: '/images/hero-bg.jpg',
      aboutImage: '/images/about-bg.jpg',
    },
  });

  // Os dois tipos de serviço fixos usados nas páginas de Búzios/Cartas.
  const servicesSeed = [
    {
      type: 'buzios',
      title: 'Jogo de Búzios',
      description: 'Consulta oracular realizada dentro da tradição da casa, buscando orientação espiritual para questões e caminhos apresentados pelo consulente.',
      howItWorks: 'O atendimento é individual. O consulente apresenta suas questões e a leitura é realizada de acordo com os fundamentos e a orientação espiritual praticados na casa.',
      duration: 'Consulte no agendamento',
      orientation: 'O atendimento deve ser agendado previamente. Para informações sobre horários, valores e preparação para a consulta, entre em contato pelo WhatsApp da casa.',
      requiresScheduling: true,
    },
    {
      type: 'cards',
      title: 'Jogo de Cartas',
      description: 'Consulta de orientação e reflexão por meio das cartas, conduzida de forma individual e respeitosa, de acordo com a prática da casa.',
      howItWorks: 'O consulente apresenta o tema ou as questões que deseja compreender melhor e a consulta é conduzida por meio da leitura das cartas e sua interpretação.',
      duration: 'Consulte no agendamento',
      orientation: 'O atendimento deve ser agendado previamente. Para informações sobre horários, valores e preparação para a consulta, entre em contato pelo WhatsApp da casa.',
      requiresScheduling: true,
    },
  ];
  for (const s of servicesSeed) {
    const existingService = await prisma.serviceInfo.findFirst({ where: { type: s.type } });
    if (!existingService) {
      await prisma.serviceInfo.create({ data: s });
    } else {
      await prisma.serviceInfo.update({ where: { id: existingService.id }, data: s });
    }
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
