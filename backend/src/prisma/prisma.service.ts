import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // No Prisma 7, o uso de adapters é o padrão recomendado.
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    console.log('[Prisma] Conectando ao PostgreSQL (Neon) via Adapter...');
    try {
      await this.$connect();
      console.log('[Prisma] Conexão com Neon estabelecida com sucesso.');
    } catch (error) {
      console.error('[Prisma] Erro ao conectar no Neon:', error.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
