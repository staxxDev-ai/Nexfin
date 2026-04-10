const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma', 'dev.db');
const db = new Database(dbPath);

try {
  // 1. Criar usuário se não existir
  const email = 'contato@nexfin.com';
  db.prepare("INSERT OR IGNORE INTO users (id, email, name, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    'test-user-id', email, 'User Nexfin Teste', 'ADMIN', 1, new Date().toISOString(), new Date().toISOString()
  );

  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  const userId = user.id;

  // 2. Criar conta
  db.prepare("INSERT INTO accounts (id, user_id, bank_name, bank_code, account_type, balance, currency, is_connected, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    'test-acc-id', userId, 'Nubank', '260', 'CHECKING', 15420.50, 'BRL', 1, new Date().toISOString(), new Date().toISOString()
  );

  // 3. Criar investimento
  db.prepare("INSERT INTO investments (id, account_id, name, type, balance, currency, last_sync_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    'test-inv-id', 'test-acc-id', 'Tesouro Direto 2029', 'FIXED_INCOME', 50000.00, 'BRL', new Date().toISOString()
  );

  console.log('✅ Dados inseridos com sucesso diretamente no SQLite!');
  console.log('User ID:', userId);
} catch (error) {
  console.error('❌ Erro na inserção direta:', error);
} finally {
  db.close();
}
