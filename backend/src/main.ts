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

  app.enableCors({
    origin: true, // Libera qualquer origem para teste de conexão
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ── Prefixo global das rotas ──
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`🚀 NEXFIN Backend v3.1 rodando em http://localhost:${port}/api/v1`);
  logger.log(`⚡ WebSocket Gateway em ws://localhost:3002/nexfin`);
  logger.log(`📅 Timezone: America/Sao_Paulo — ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
}

bootstrap().catch((err) => {
  Logger.error('Falha crítica no bootstrap:', err);
  process.exit(1);
});
