import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Aplicando Cadeados de Imutabilidade (SQLite Triggers) ---');

  const triggers = [
    // Impedir UPDATE na tabela transactions
    `CREATE TRIGGER IF NOT EXISTS prevent_transaction_update
     BEFORE UPDATE ON transactions
     BEGIN
       SELECT RAISE(ABORT, 'Operação Bloqueada: Transações financeiras não podem ser alteradas no NEXFIN v3.1.');
     END;`,

    // Impedir DELETE na tabela transactions
    `CREATE TRIGGER IF NOT EXISTS prevent_transaction_delete
     BEFORE DELETE ON transactions
     BEGIN
       SELECT RAISE(ABORT, 'Operação Bloqueada: Transações financeiras não podem ser apagadas do Ledger.');
     END;`,
  ];

  for (const sql of triggers) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✔ Gatilho aplicado com sucesso.');
    } catch (e) {
      console.error('❌ Erro ao aplicar gatilho:', e.message);
    }
  }

  await prisma.$disconnect();
}

main();
