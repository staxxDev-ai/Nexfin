const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Configurar o adapter para o Prisma 7
const dbPath = path.resolve(__dirname, 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed com adapter BetterSqlite3...');
  
  const user = await prisma.user.upsert({
    where: { email: 'contato@nexfin.com' },
    update: {},
    create: {
      email: 'contato@nexfin.com',
      name: 'User Teste',
      role: 'ADMIN',
    },
  });

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      bankName: 'Nubank',
      bankCode: '260',
      accountType: 'CHECKING',
      balance: 15420.50,
      currency: 'BRL',
      isConnected: true,
    },
  });

  await prisma.investment.create({
    data: {
      accountId: account.id,
      name: 'Tesouro Direto 2029',
      type: 'FIXED_INCOME',
      balance: 50000.00,
      annualRate: 0.12,
    },
  });

  console.log('✅ Seed completo!');
  console.log('User ID:', user.id);
  console.log('Dados inseridos para teste de contexto da IA.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
