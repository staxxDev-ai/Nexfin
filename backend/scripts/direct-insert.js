const Database = require('better-sqlite3');
const path = require('path');

// Caminho para o banco de dados SQLite (detectado na raiz do backend pela env)
const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

async function main() {
  const email = 'admin@nexfin.com';
  // Hash para 'password123'
  const passwordHash = '$2b$10$cW6/dPXcNgvQ2HNCQS1UJOV8vWnngrTaXN7aen0VI7ZByEF2P/hwS';
  const name = 'Administrador NEXFIN';
  const id = 'admin-test-uuid-final';

  try {
    // Tenta deletar se já existir para garantir o hash correto
    db.prepare('DELETE FROM users WHERE email = ?').run(email);
    
    const stmt = db.prepare('INSERT INTO users (id, email, password_hash, name, role, is_active, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, email, passwordHash, name, 'ADMIN', 1, new Date().toISOString());
    
    console.log('USUARIO_TESTE_SUCCESS: admin@nexfin.com');
  } catch (err) {
    console.error('ERRO INTERNO:', err.message);
  } finally {
    db.close();
  }
}

main();
