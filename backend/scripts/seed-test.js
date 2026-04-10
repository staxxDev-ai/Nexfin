const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@nexfin.com';
  // Hash para 'password123'
  const passwordHash = '$2b$10$cW6/dPXcNgvQ2HNCQS1UJOV8vWnngrTaXN7aen0VI7ZByEF2P/hwS';

  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      passwordHash, 
      name: 'Administrador NEXFIN' 
    },
    create: {
      email,
      passwordHash,
      name: 'Administrador NEXFIN',
      role: 'ADMIN',
    },
  });

  console.log('USUARIO_TESTE_PRONTO:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
