const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

async function main() {
  console.log('🚀 Iniciando normalização de polaridade master...');

  const dbUrl = 'file:./prisma/dev.db';
  const resolvedUrl = `file:${path.resolve(process.cwd(), dbUrl.slice(5))}`;
  const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });

  const prisma = new PrismaClient({ adapter });

  // 1. Corrigir Polaridade em Contas de CRÉDITO
  const creditAccounts = await prisma.account.findMany({
    where: { accountType: 'CREDIT' }
  });

  console.log(`\n--- Contas de CRÉDITO (${creditAccounts.length}) ---`);
  for (const acc of creditAccounts) {
    const transactions = await prisma.transaction.findMany({
      where: { accountId: acc.id }
    });

    let fixed = 0;
    for (const tx of transactions) {
      // Inverter sinais se necessário para Crédito
      // Pluggy Positivo -> Gasto -> Nosso sistema deve ser Negativo
      if (tx.amount > 0) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { amount: -tx.amount, type: 'DEBIT' }
        });
        fixed++;
      } else if (tx.amount < 0) {
        // Pluggy Negativo -> Pagamento -> Nosso sistema deve ser Positivo
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { amount: Math.abs(tx.amount), type: 'CREDIT' }
        });
        fixed++;
      }
    }
    console.log(`✅ ${acc.bankName}: ${fixed} transações normalizadas.`);
  }

  // 2. Corrigir Polaridade em Contas de DÉBITO (CHECKING/SAVINGS)
  // Alguns dados antigos podem ter sido salvos positivos por erro de lógica anterior
  const checkingAccounts = await prisma.account.findMany({
    where: { accountType: { in: ['CHECKING', 'SAVINGS'] } }
  });

  console.log(`\n--- Contas de DÉBITO (${checkingAccounts.length}) ---`);
  for (const acc of checkingAccounts) {
    // Aqui é mais delicado. Vamos assumir que se a descrição tiver palavras de gasto 
    // e o valor for positivo, talvez esteja invertido. 
    // Mas por segurança, vamos apenas garantir que se o 'type' for DEBIT, o valor SEJA negativo.
    const transactions = await prisma.transaction.findMany({
      where: { accountId: acc.id }
    });

    let fixed = 0;
    for (const tx of transactions) {
      // Se está marcado como DEBIT mas o valor é positivo -> Inverter
      if (tx.type === 'DEBIT' && tx.amount > 0) {
         await prisma.transaction.update({
          where: { id: tx.id },
          data: { amount: -tx.amount }
        });
        fixed++;
      }
    }
    console.log(`✅ ${acc.bankName}: ${fixed} transações de débito corrigidas.`);
  }

  console.log('\n✨ Tudo pronto! O Extrato agora deve refletir os dados corretamente.');
  await prisma.$disconnect();
}

main().catch(console.error);
