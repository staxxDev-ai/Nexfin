import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const logger = new Logger('Bootstrap');

  // ── Segurança: Validação global de DTOs ──
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,          // Remove campos não declarados no DTO
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));

  // ── FORÇA BRUTA: Middleware manual de CORS para contornar bloqueios do framework ──
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Responde imediatamente ao preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // ── Prefixo global das rotas ──
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`🚀 NEXFIN Backend v4.0 (CORS UNLOCKED) rodando em port ${port}`);
  logger.log(`⚡ WebSocket Gateway em ws://localhost:3002/nexfin`);
  logger.log(`📅 Timezone: America/Sao_Paulo — ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
}

bootstrap().catch((err) => {
  Logger.error('Falha crítica no bootstrap:', err);
  process.exit(1);
});
