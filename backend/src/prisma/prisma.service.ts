import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Prisma 7: SQLite requer driver adapter. O adapter recebe { url } como string.
    const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
    // Garantir caminho absoluto para o arquivo SQLite
    const resolvedUrl = dbUrl.startsWith('file:')
      ? `file:${path.resolve(process.cwd(), dbUrl.slice(5))}`
      : dbUrl;

    const adapter = new PrismaBetterSqlite3({ url: resolvedUrl });

    super({
      adapter,
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    console.log('[Prisma] Conectando ao banco de dados...');
    await this.$connect();
    console.log('[Prisma] Conexão estabelecida com sucesso.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
