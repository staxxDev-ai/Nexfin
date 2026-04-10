import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PluggyClient } from 'pluggy-sdk';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption/encryption.service';
import { AuditService } from '../../common/audit/audit.service';
import { BalanceGateway } from '../websocket/balance.gateway';

/**
 * Mapa de identificação para conectores do Sandbox da Pluggy.
 * Resolve nomes genéricos como 'MeuPluggy' para nomes reais.
 */
const BANK_MAP: Record<string, { name: string; logo?: string; color: string }> = {
  '202': { name: 'Nubank', logo: 'https://nubank.com.br/favicon.ico', color: '#820ad1' },
  '2': { name: 'Itaú', logo: 'https://www.itau.com.br/favicon.ico', color: '#ec7000' },
  '3': { name: 'Bradesco', logo: 'https://banco.bradesco/favicon.ico', color: '#cc092f' },
  '4': { name: 'Santander', logo: 'https://www.santander.com.br/favicon.ico', color: '#ec0000' },
  '5': { name: 'Banco do Brasil', logo: 'https://www.bb.com.br/favicon.ico', color: '#fcf800' },
};

@Injectable()
export class OpenFinanceService {
  private readonly logger = new Logger(OpenFinanceService.name);

  constructor(
    public readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly gateway: BalanceGateway,
  ) {}

  /**
   * Obtém o cliente Pluggy configurado para o usuário específico.
   * Prioriza chaves salvas no banco de dados do usuário.
   * Fallback para variáveis de ambiente globais.
   */
  private async getClientForUser(userId: string): Promise<PluggyClient> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { encryptedPluggyClientId: true, encryptedPluggyClientSecret: true },
    });

    let clientId = process.env.PLUGGY_CLIENT_ID || '';
    let clientSecret = process.env.PLUGGY_CLIENT_SECRET || '';

    if (user?.encryptedPluggyClientId && user?.encryptedPluggyClientSecret) {
      clientId = user.encryptedPluggyClientId;
      clientSecret = user.encryptedPluggyClientSecret;
      this.logger.debug(`[getClientForUser] Usando credenciais do usuário ${userId}`);
    } else {
      this.logger.debug(`[getClientForUser] Usando credenciais globais do .env para userId=${userId}`);
    }

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Credenciais da Pluggy não configuradas. Configure seu Client ID e Secret no painel de contas.');
    }

    return new PluggyClient({ clientId, clientSecret });
  }

  /**
   * Valida as credenciais tentando gerar um connect token real.
   * Usado no fluxo de setup para confirmar credenciais antes de avançar.
   */
  async validateCredentials(clientId: string, clientSecret: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const client = new PluggyClient({ clientId, clientSecret });
      await client.createConnectToken();
      return { valid: true };
    } catch (error: any) {
      this.logger.warn(`[validateCredentials] Credenciais inválidas: ${error.message}`);
      return { valid: false, error: error.message || 'Credenciais inválidas ou sem permissão na Pluggy.' };
    }
  }

  /**
   * Salva as credenciais da Pluggy para o usuário após validação.
   */
  async saveCredentials(userId: string, clientId: string, clientSecret: string): Promise<void> {
    const validation = await this.validateCredentials(clientId, clientSecret);

    if (!validation.valid) {
      throw new BadRequestException(
        `Credenciais inválidas na Pluggy: ${validation.error}. Verifique seu Client ID e Secret.`,
      );
    }

    await this.prisma.user.upsert({
      where: { id: userId },
      update: {
        encryptedPluggyClientId: clientId,
        encryptedPluggyClientSecret: clientSecret,
      },
      create: {
        id: userId,
        email: `nexfin-user-${userId.slice(-6)}@nexfin.com`, // Email único baseado no final do ID
        name: 'User Nexfin',
        role: 'ADMIN',
        encryptedPluggyClientId: clientId,
        encryptedPluggyClientSecret: clientSecret,
      },
    });

    await this.audit.record({
      eventType: 'API_KEY_UPDATED',
      entityType: 'User',
      entityId: userId,
      userId: userId,
      payload: { action: 'updated_pluggy_credentials' },
    });

    this.logger.log(`[saveCredentials] Credenciais salvas com sucesso para ${userId}`);
  }

  /**
   * Gera um Connect Token para o widget da Pluggy.
   * Lança erro se as credenciais forem inválidas (sem silencio).
   */
  async createConnectToken(userId: string, connectorId?: string): Promise<string> {
    this.logger.log(`[createConnectToken] Gerando token para userId=${userId}`);
    const client = await this.getClientForUser(userId);
    const response = await client.createConnectToken(connectorId);
    this.logger.log(`[createConnectToken] Token gerado com sucesso`);
    return response.accessToken;
  }

  /**
   * Lista as contas bancárias conectadas do usuário (dados reais do banco).
   */
  async getUserAccounts(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, isConnected: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bankName: true,
        bankCode: true,
        bankColor: true,
        bankLogoUrl: true,
        accountType: true,
        accountNumber: true,
        balance: true,
        currency: true,
        isConnected: true,
        lastSyncAt: true,
        pluggyItemId: true,
        creditLimit: true,
        availableLimit: true,
        currentInvoice: true,
      },
    });
  }

  /**
   * Retorna um resumo dos saldos consolidados por moeda para o Dashboard.
   */
  async getSummary(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isConnected: true },
      select: { balance: true, currency: true },
    });

    // Agrupar por moeda
    const summary: Record<string, { total: number; count: number; currency: string }> = {};

    accounts.forEach(acc => {
      const curr = acc.currency || 'BRL';
      if (!summary[curr]) {
        summary[curr] = { total: 0, count: 0, currency: curr };
      }
      summary[curr].total += acc.balance;
      summary[curr].count += 1;
    });

    // Converter para array e formatar para o frontend
    return Object.values(summary).map(s => ({
      id: s.currency.toLowerCase(),
      label: s.currency === 'BRL' ? 'REAL BRASILEIRO' : s.currency === 'USD' ? 'DÓLAR AMERICANO' : `CONTA ${s.currency}`,
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: s.currency }).format(s.total),
      change: '+0.0%', // No futuro, calcular baseado no histórico
      color: s.currency === 'BRL' ? '#22c55e' : s.currency === 'USD' ? '#3b82f6' : '#a855f7',
      symbol: s.currency,
      rawTotal: s.total
    }));
  }

  /**
   * Finaliza a conexão salvando o itemId e buscando as contas iniciais.
   * Compatível com ambas as estruturas de retorno do widget Pluggy Connect.
   */
  async linkConnection(userId: string, itemId: string): Promise<void> {
    this.logger.log(`[linkConnection] Vinculando item ${itemId} para usuário ${userId}`);

    const client = await this.getClientForUser(userId);

    // 1. Buscar detalhes da conexão (Item)
    const item = await client.fetchItem(itemId);

    // 2. Buscar contas vinculadas a este item
    const { results: pluggyAccounts } = await client.fetchAccounts(itemId);

    if (pluggyAccounts.length === 0) {
      this.logger.warn(`[linkConnection] Nenhuma conta retornada pelo item ${itemId}`);
    }

    for (const pAcc of pluggyAccounts) {
      // Verificar se já existe uma conta com este pluggyItemId + accountNumber para evitar duplicatas
      const existing = await this.prisma.account.findFirst({
        where: { userId, pluggyItemId: itemId, accountNumber: pAcc.number },
      });

      const connectorId = String(item.connector?.id || '0');
      const mappedBank = BANK_MAP[connectorId];

      const accountData: any = {
        userId,
        bankName: mappedBank?.name || item.connector?.name || 'Banco Desconhecido',
        bankCode: connectorId,
        bankColor: mappedBank?.color || item.connector?.primaryColor || '#3b82f6',
        bankLogoUrl: mappedBank?.logo || item.connector?.imageUrl || null,
        accountType: this.mapAccountType(pAcc.type),
        accountNumber: pAcc.number || null,
        pluggyItemId: itemId,
        balance: pAcc.balance || 0,
        currency: pAcc.currencyCode || 'BRL',
        isConnected: true,
        lastSyncAt: new Date(),
      };

      // Adicionar dados de crédito se disponíveis
      if (pAcc.type === 'CREDIT' && pAcc.creditData) {
        accountData.creditLimit = pAcc.creditData.creditLimit || null;
        accountData.availableLimit = pAcc.creditData.availableCreditLimit || null;
        // Na Pluggy, o balance de cartões geralmente é a fatura atual (valor devido)
        accountData.currentInvoice = pAcc.balance || 0;
      }

      let savedAccount;
      if (existing) {
        savedAccount = await this.prisma.account.update({
          where: { id: existing.id },
          data: { 
            balance: accountData.balance, 
            creditLimit: accountData.creditLimit,
            availableLimit: accountData.availableLimit,
            currentInvoice: accountData.currentInvoice,
            lastSyncAt: accountData.lastSyncAt, 
            isConnected: true 
          },
        });
        this.logger.debug(`[linkConnection] Conta existente atualizada: ${existing.id}`);
      } else {
        savedAccount = await this.prisma.account.create({ data: accountData });
        this.logger.log(`[linkConnection] Nova conta criada: ${savedAccount.id} (${accountData.bankName})`);
      }

      // 3. Carga inicial de transações e investimentos em SEGUNDO PLANO (Background)
      this.syncTransactions(userId, pAcc.id, savedAccount.id).catch(err => {
        this.logger.error(`[linkConnection] Falha no sync background de transações da conta ${savedAccount.id}: ${err.message}`);
      });

      this.syncInvestments(userId, itemId, savedAccount.id).catch(err => {
        this.logger.error(`[linkConnection] Falha no sync background de investimentos do item ${itemId}: ${err.message}`);
      });
    }

    await this.audit.record({
      eventType: 'ACCOUNT_CONNECTED',
      entityType: 'Account',
      entityId: itemId,
      userId,
      payload: { itemId, accountsLinked: pluggyAccounts.length },
    });
  }

  /**
   * Sincroniza transações de uma conta específica usando o ID da conta na Pluggy.
   */
  async syncTransactions(userId: string, pluggyAccountId: string, internalAccountId: string): Promise<void> {
    try {
      const client = await this.getClientForUser(userId);
      const { results: transactions } = await client.fetchTransactions(pluggyAccountId);

      this.logger.log(`[syncTransactions] Sincronizando ${transactions.length} transações para conta ${internalAccountId}`);

      // Buscar tipo da conta para normalização de sinal
      const account = await this.prisma.account.findUnique({
        where: { id: internalAccountId },
        select: { accountType: true }
      });

      for (const pTx of transactions) {
        let normalizedAmount = pTx.amount;
        let mappedType = pTx.amount > 0 ? 'CREDIT' : 'DEBIT';

        // Se for cartão de crédito, Pluggy envia gastos como POSITIVOS (aumento de dívida)
        // Precisamos inverter para que gastos sejam NEGATIVOS no nosso sistema (PADRÃO NEXFIN)
        if (account?.accountType === 'CREDIT') {
          // Gasto no cartão (aumento de fatura) -> pluggy envia > 0
          if (pTx.amount > 0) {
            normalizedAmount = -pTx.amount;
            mappedType = 'DEBIT'; // Saída
          } else {
            // Pagamento de fatura (estorno ou pagamento) -> pluggy envia < 0
            normalizedAmount = Math.abs(pTx.amount);
            mappedType = 'CREDIT'; // Entrada
          }
        }

        await this.prisma.transaction.upsert({
          where: { id: pTx.id },
          create: {
            id: pTx.id,
            accountId: internalAccountId,
            encryptedDescription: this.encryption.encrypt(pTx.description || ''),
            amount: normalizedAmount,
            date: new Date(pTx.date),
            category: pTx.category || null,
            type: mappedType,
            status: 'COMPLETED',
          },
          update: {
            amount: normalizedAmount,
            category: pTx.category || null,
            status: 'COMPLETED',
            type: mappedType,
          },
        });
      }
    } catch (error: any) {
      this.logger.warn(`[syncTransactions] Erro ao sincronizar: ${error.message}`);
    }
  }

  private mapAccountType(type: string): any {
    const map: Record<string, string> = {
      CHECKING: 'CHECKING',
      SAVINGS: 'SAVINGS',
      INVESTMENT: 'INVESTMENT',
      CREDIT: 'CREDIT',
    };
    return map[type] || 'CHECKING';
  }

  /**
   * Sincroniza investimentos de um item/conta específica usando a Pluggy.
   */
  async syncInvestments(userId: string, itemId: string, internalAccountId: string): Promise<void> {
    try {
      const client = await this.getClientForUser(userId);
      const { results: investments } = await client.fetchInvestments(itemId);

      this.logger.log(`[syncInvestments] Sincronizando ${investments.length} investimentos para o item ${itemId}`);

      for (const pInv of investments) {
        await this.prisma.investment.upsert({
          where: { id: pInv.id },
          create: {
            id: pInv.id,
            accountId: internalAccountId,
            name: pInv.name,
            type: pInv.type,
            subtype: pInv.subtype || null,
            balance: pInv.balance,
            currency: pInv.currencyCode || 'BRL',
            annualRate: pInv.annualRate || null,
            lastSyncAt: new Date(),
          },
          update: {
            balance: pInv.balance,
            annualRate: pInv.annualRate || null,
            lastSyncAt: new Date(),
          },
        });
      }
    } catch (error: any) {
      this.logger.warn(`[syncInvestments] Erro ao sincronizar investimentos: ${error.message}`);
    }
  }

  /**
   * Retorna o extrato de transações com descrições descriptografadas.
   */
  async getTransactions(userId: string, query?: { startDate?: string; endDate?: string; bank?: string }) {
    const where: any = {
      account: { userId },
    };

    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    if (query?.bank) {
      where.account.bankName = { contains: query.bank };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            bankName: true,
            bankColor: true,
            accountType: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map(t => ({
      ...t,
      description: this.encryption.decrypt(t.encryptedDescription),
      bank: t.account.bankName,
      bankColor: t.account.bankColor,
      accountType: t.account.accountType,
    }));
  }

  /**
   * Retorna a lista de investimentos do usuário.
   */
  async getInvestments(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { 
        account: { userId },
        balance: { gt: 0 }
      },
      include: {
        account: {
          select: {
            bankName: true,
            bankColor: true,
          },
        },
      },
      orderBy: { balance: 'desc' },
    });

    return investments.map(inv => ({
      ...inv,
      bank: inv.account.bankName,
      bankColor: inv.account.bankColor,
    }));
  }

  async syncAccount(accountId: string): Promise<void> {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account || !account.pluggyItemId) return;
    await this.linkConnection(account.userId, account.pluggyItemId);
  }

  /**
   * Sincroniza todas as contas conectadas de um usuário.
   */
  async syncAllUserAccounts(userId: string): Promise<void> {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isConnected: true },
      select: { pluggyItemId: true },
    });

    // Obter IDs de itens únicos para evitar múltiplas chamadas desnecessárias à Pluggy
    const uniqueItemIds = Array.from(new Set(accounts.map(a => a.pluggyItemId).filter(id => !!id))) as string[];

    if (uniqueItemIds.length === 0) {
      this.logger.debug(`[syncAllUserAccounts] Nenhuma conta conectada para o usuário ${userId}`);
      return;
    }

    this.logger.log(`[syncAllUserAccounts] Sincronizando ${uniqueItemIds.length} itens para o usuário ${userId}`);

    // Sincronizar itens em paralelo para ganhos massivos de performance
    await Promise.allSettled(uniqueItemIds.map(async (itemId) => {
      try {
        await this.linkConnection(userId, itemId);
      } catch (error: any) {
        this.logger.error(`[syncAllUserAccounts] Falha ao sincronizar item ${itemId}: ${error.message}`);
      }
    }));
  }

  /**
   * Verifica se o usuário já possui credenciais da Pluggy configuradas.
   */
  async hasCredentials(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { encryptedPluggyClientId: true, encryptedPluggyClientSecret: true },
    });

    return !!(user?.encryptedPluggyClientId && user?.encryptedPluggyClientSecret);
  }

  /**
   * Processa Webhooks recebidos da Pluggy.
   * Suporta eventos de TRANSACTION_CREATED e ITEM_UPDATED.
   */
  async handleWebhook(payload: any): Promise<void> {
    const { event, itemId, data } = payload;
    this.logger.log(`[Webhook] Evento recebido: ${event} para item ${itemId}`);

    if (!itemId) return;

    // Localizar o usuário dono deste item
    const account = await this.prisma.account.findFirst({
      where: { pluggyItemId: itemId },
      select: { userId: true },
    });

    if (!account) {
      this.logger.warn(`[Webhook] Usuário não encontrado para o item ${itemId}. O item pode ainda não ter sido vinculado.`);
      return;
    }

    const userId = account.userId;

    // 1. Caso seja atualização de Item (Status, Saldo total, etc)
    if (event === 'item/updated') {
      this.logger.log(`[Webhook] Atualizando item ${itemId} em resposta ao webhook.`);
      await this.linkConnection(userId, itemId);
      
      // Notificar frontend sobre mudança de saldo
      const accounts = await this.getUserAccounts(userId);
      for (const acc of accounts) {
        if (acc.pluggyItemId === itemId) {
          this.gateway.emitBalanceUpdate(userId, {
            accountId: acc.id,
            balance: acc.balance,
            currency: acc.currency,
            bankName: acc.bankName,
          });
        }
      }
    }

    // 2. Caso seja uma nova transação (Pix, Compra, etc)
    if (event === 'transaction/created' && data) {
      this.logger.log(`[Webhook] Nova transação detectada para o item ${itemId}`);
      
      // Sincronizar transações desta conta específica
      // O syncTransactions já salva no banco e gera auditoria
      // Precisamos do accountId real (interno)
      const internalAccount = await this.prisma.account.findFirst({
        where: { userId, pluggyItemId: itemId },
      });

      if (internalAccount) {
        // Atualizar transações em background
        // Nota: O payload do webhook de transaction/created geralmente contém a transação simplificada em 'data'
        // Mas para garantir consistência total com filtros e categorias, dispararmos o sync total do item
        await this.linkConnection(userId, itemId);

        // Emitir evento de 'Nova Transação' via Socket para efeitos visuais no frontend
        this.gateway.emitNewTransaction(userId, {
          id: data.id || 'new',
          accountId: internalAccount.id,
          description: data.description || 'Nova Transação',
          amount: data.amount || 0,
          currency: internalAccount.currency || 'BRL',
          date: data.date || new Date().toISOString(),
          bankName: internalAccount.bankName,
        });

        // Alerta opcional de Agente (Ex: Marie detectando gastos inesperados)
        if (data.amount < -500) {
           this.gateway.emitAgentInsight(userId, {
             agentName: 'MARIE',
             message: `Detectei uma saída relevante de ${data.amount} no ${internalAccount.bankName}. Quer que eu classifique?`,
             severity: 'info'
           });
        }
      }
    }
  }
}
