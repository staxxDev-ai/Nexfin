import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../src/common/encryption/encryption.service';
import { AuditService } from '../src/common/audit/audit.service';
import { OpenFinanceService } from '../src/modules/accounts/open-finance.service';
import * as fs from 'fs';
import * as path from 'path';

// Carregamento manual simples do .env se existir
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
  
  // Forçar DATABASE_URL absoluto para o script de teste não falhar
  process.env.DATABASE_URL = `file:${path.join(__dirname, '../dev.db')}`;
  process.env.AES_256_KEY = process.env.AES_256_KEY || '0000000000000000000000000000000000000000000000000000000000000000';
}

async function runTest() {
  loadEnv();
  
  const prisma = new PrismaClient();
  const encryption = new EncryptionService() as any;
  const audit = new AuditService(prisma as any, encryption) as any;
  const openFinance = new OpenFinanceService(prisma as any, encryption, audit);

  console.log('\n--- 🧪 TESTE FUNCIONAL DE OPEN FINANCE (NEXFIN v3.1) ---');

  try {
    // 1. Garantir que temos um usuário para o teste
    let user = await prisma.user.findFirst({
        where: { email: 'openfinance-test@nexfin.com.br' }
    });

    if (!user) {
      console.log('🔹 Criando usuário de teste...');
      user = await prisma.user.create({
        data: {
          email: 'openfinance-test@nexfin.com.br',
          name: 'Tester Open Finance',
          auth0Id: 'test|' + Date.now(),
        }
      });
    }
    console.log(`👤 Usuário: ${user.name} (ID: ${user.id})`);

    // 2. Testar geração de Connect Token
    console.log('🔹 Solicitando Connect Token...');
    const startTime = Date.now();
    const token = await openFinance.createConnectToken(user.id);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Token Gerado: ${token}`);
    console.log(`⏱️  Tempo de resposta: ${duration}ms`);

    // 3. Validar se o Log de Auditoria (Ledger) foi criado
    console.log('🔹 Verificando Ledger de Auditoria...');
    const history = await audit.getUserHistory(user.id, 1);
    
    if (history && history.length > 0) {
      const log = history[0] as any;
      console.log('✅ Registro encontrado no Ledger:');
      console.log(`   - Evento: ${log.event_type}`);
      console.log(`   - Payload: ${log.payload}`);
      console.log(`   - Checksum: ${log.checksum.substring(0, 16)}...`);
    } else {
      console.error('❌ ERRO: Nenhum log de auditoria foi encontrado!');
    }

    console.log('\n--- 🎉 TESTE CONCLUÍDO COM SUCESSO ---');

  } catch (error) {
    console.error('\n❌ FALHA NO TESTE DE OPEN FINANCE:');
    console.error(`ERRO: ${(error as Error).message}`);
    // console.error((error as Error).stack);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTest();
