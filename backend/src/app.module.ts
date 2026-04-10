import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AiAgentsService } from './modules/ai-agents/ai-agents.service';
import { AiAgentsController } from './modules/ai-agents/ai-agents.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common/common.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Configurações globais via .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting: 100 requests / 15 min por IP
    ThrottlerModule.forRoot([{
      ttl: 15 * 60 * 1000, // 15 minutos em ms
      limit: 100,
    }]),

    // Prisma global
    PrismaModule,

    // Módulos Comuns
    CommonModule,

    // Módulos de Domínio
    AuthModule,
    AccountsModule,
    WebsocketModule,
    UsersModule,
  ],
  providers: [
    AiAgentsService,
  ],
  controllers: [
    AiAgentsController,
  ],
})
export class AppModule {}
