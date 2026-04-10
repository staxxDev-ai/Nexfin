import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * NEXFIN WebSocket Gateway
 * Emite atualizações de saldo em tempo real para o frontend.
 *
 * Eventos emitidos:
 *  - balance:update  → { accountId, balance, currency, timestamp }
 *  - agent:insight   → { agentName, message, severity }
 *  - sync:status     → { accountId, status: 'syncing' | 'done' | 'error' }
 */
@WebSocketGateway(3002, {
  cors: {
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/nexfin',
})
export class BalanceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BalanceGateway.name);

  // Map de userId → Set de socketIds para multicast por usuário
  private userSockets = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      this.logger.log(`Cliente conectado: ${client.id} (user: ${userId})`);
    }
  }

  handleDisconnect(client: Socket) {
    this.userSockets.forEach((sockets, userId) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    });
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  /**
   * Emite atualização de saldo para um usuário específico
   */
  emitBalanceUpdate(userId: string, payload: {
    accountId: string;
    balance: number;
    currency: string;
    bankName: string;
  }) {
    this.server.to(`user:${userId}`).emit('balance:update', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emite insight de um Agente IA para o usuário
   */
  emitAgentInsight(userId: string, payload: {
    agentName: 'ALBERT' | 'MARIE' | 'GALILEU';
    message: string;
    severity: 'info' | 'warning' | 'critical';
    metadata?: Record<string, unknown>;
  }) {
    this.server.to(`user:${userId}`).emit('agent:insight', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emite status de sincronização de conta
   */
  emitSyncStatus(userId: string, accountId: string, status: 'syncing' | 'done' | 'error') {
    this.server.to(`user:${userId}`).emit('sync:status', {
      accountId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emite uma nova transação (Pix, etc) para o usuário em tempo real
   */
  emitNewTransaction(userId: string, payload: {
    id: string;
    accountId: string;
    description: string;
    amount: number;
    currency: string;
    date: string;
    bankName: string;
  }) {
    this.server.to(`user:${userId}`).emit('transaction:new', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): string {
    return 'pong';
  }
}
