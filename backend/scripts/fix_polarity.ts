import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando normalização de polaridade para Cartões de Crédito...');

  // 1. Encontrar todas as contas de Crédito
  const creditAccounts = await prisma.account.findMany({
    where: { accountType: 'CREDIT' },
    select: { id: true, bankName: true }
  });

  console.log(`Encontradas ${creditAccounts.length} contas de crédito.`);

  for (const acc of creditAccounts) {
    console.log(`\nProcessando conta: ${acc.bankName} (${acc.id})`);

    // 2. Buscar todas as transações dessa conta
    const transactions = await prisma.transaction.findMany({
      where: { accountId: acc.id }
    });

    console.log(`- ${transactions.length} transações encontradas.`);

    let fixedCount = 0;
    for (const tx of transactions) {
      // Regra: No cartão de crédito, valores positivos vindos da Pluggy (aumento de dívida)
      // devem ser NEGATIVOS no nosso sistema (DEBIT).
      // Se o valor está positivo e marcado como CREDIT, precisamos inverter.
      
      let needsFix = false;
      let newAmount = tx.amount;
      let newType = tx.type;

      if (tx.amount > 0) {
        // Gasto que foi salvo como positivo/entrada -> deve ser negativo/saída
        newAmount = -tx.amount;
        newType = 'DEBIT';
        needsFix = true;
      } else if (tx.amount < 0) {
        // Pagamento/Estorno que foi salvo como negativo -> deve ser positivo
        newAmount = Math.abs(tx.amount);
        newType = 'CREDIT';
        needsFix = true;
      }

      if (needsFix) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            amount: newAmount,
            type: newType
          }
        });
        fixedCount++;
      }
    }

    console.log(`- ✅ ${fixedCount} transações corrigidas nesta conta.`);
  }

  console.log('\n✨ Normalização concluída!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a normalização:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
