import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@nexfin.com';
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: 'Administrador NEXFIN' },
    create: {
      email,
      passwordHash,
      name: 'Administrador NEXFIN',
      role: 'ADMIN',
    },
  });

  console.log('Usuário de teste criado/atualizado:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
