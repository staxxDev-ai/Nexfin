import { Client } from 'pg';
import 'dotenv/config';

async function main() {
  console.log('--- Aplicando Cadeados de Imutabilidade via PG Nativo (Neon) ---');

  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrada no .env');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necessário para conexões Neon/AWS
  });

  const setupSQL = `
    CREATE OR REPLACE FUNCTION nexfin_prevent_modification() 
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'Operação Bloqueada: Transações financeiras não podem ser alteradas/apagadas no NEXFIN v3.1.';
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_transaction_update') THEN
            CREATE TRIGGER trg_prevent_transaction_update
            BEFORE UPDATE ON transactions
            FOR EACH ROW EXECUTE FUNCTION nexfin_prevent_modification();
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_transaction_delete') THEN
            CREATE TRIGGER trg_prevent_transaction_delete
            BEFORE DELETE ON transactions
            FOR EACH ROW EXECUTE FUNCTION nexfin_prevent_modification();
        END IF;
    END $$;
  `;

  try {
    await client.connect();
    console.log('✔ Conectado ao Neon.');
    await client.query(setupSQL);
    console.log('✔ Sistema de Imutabilidade aplicado com sucesso.');
  } catch (e) {
    console.error('❌ Erro ao aplicar gatilhos no Neon:', e.message);
  } finally {
    await client.end();
  }
}

main();
