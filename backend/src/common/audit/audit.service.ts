import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';

export type LedgerEventType =
  | 'ACCOUNT_CONNECTED'
  | 'ACCOUNT_DISCONNECTED'
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_FLAGGED'
  | 'BALANCE_UPDATED'
  | 'USER_LOGIN'
  | 'USER_MFA_ENABLED'
  | 'PLUGIN_INSTALLED'
  | 'PLUGIN_ACTIVATED'
  | 'PLUGIN_DEACTIVATED'
  | 'API_KEY_UPDATED'
  | 'SYSTEM_INIT'
  | 'CORRECTION';

export type LedgerEntry = {
  eventType: LedgerEventType;
  entityType: string;
  entityId: string;
  userId: string;
  amount?: number;
  currency?: string;
  payload: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Registra uma entrada imutável no histórico de auditoria (Ledger).
   * O checksum SHA-256 garante a integridade do payload.
   */
  async record(entry: LedgerEntry): Promise<void> {
    const timestamp = new Date().toISOString();
    const checksum = this.encryption.hash(
      JSON.stringify({ ...entry, timestamp }),
    );

    try {
      await this.prisma.ledgerHistory.create({
        data: {
          eventType: entry.eventType,
          entityType: entry.entityType,
          entityId: entry.entityId,
          userId: entry.userId,
          amount: entry.amount,
          currency: entry.currency || 'BRL',
          payload: JSON.stringify(entry.payload),
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          checksum: checksum,
        },
      });
    } catch (error) {
      // Falha no audit nunca deve interromper a operação principal
      this.logger.error(`Ledger audit failed: ${(error as Error).message}`, entry);
    }
  }

  /**
   * Consulta o histórico de auditoria de um usuário.
   */
  async getUserHistory(userId: string, limit = 50) {
    return this.prisma.ledgerHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
