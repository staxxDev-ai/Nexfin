const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configurar o adapter para o Prisma 7
const dbPath = path.resolve(__dirname, '..', 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@nexfin.com';
  const plainPassword = 'password123';
  
  console.log(`Atualizando credenciais para: ${email}...`);
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: passwordHash
    },
    create: {
      email,
      name: 'Admin',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('✅ Credenciais atualizadas com sucesso!');
  console.log('User ID:', user.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
