import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { OpenFinanceService } from '../accounts/open-finance.service';
import { PrismaService } from '../../prisma/prisma.service';

export type AgentName = 'ALBERT' | 'MARIE' | 'GALILEU' | 'FINN' | 'NEXFIN_AI';

const GLOBAL_SYSTEM_PROMPT = `Você é o NEXFIN AI, o Consultor Financeiro de Elite e Assistente Mestre da plataforma NEXFIN.
Sua missão é ser o "Cérebro Financeiro" do usuário, agindo com a inteligência combinada de 4 pilares:

1. SEGURANÇA E VIGILÂNCIA: Monitore riscos, anomalias e integridade de dados 24/7.
2. TÁTICA E FLUXO DE CAIXA: Analise hábitos de consumo, sugira cortes inteligentes e otimize o orçamento atual (abril de 2026).
3. ESTRATÉGIA E MODELAGEM: Crie modelos de 3-5 anos, analise Unit Economics (CAC, LTV, Burn Rate) e oriente o crescimento de startups.
4. PROJEÇÃO PATRIMONIAL: Projete o Net Worth até 2031 com cenários conservadores, moderados e otimistas.

DIRETRIZES DE PERSONALIDADE:
- Seja humano, fluido e proativo. Evite ser robótico. Use frases como "Analisei suas contas e notei..." ou "Se eu fosse você, focaria em...".
- Use um tom de "Parceiro de Negócios" de alto nível.
- Fale português do Brasil de forma clara e profissional.
- Se o usuário perguntar algo genérico, puxe o contexto financeiro dele para dar uma resposta personalizada.
- Em caso de riscos (ex: pouco runway), seja direto e alertador, mas sempre com uma solução prática.

Contexto temporal: estamos em abril de 2026. Considere SELIC, inflação e tendências tecnológicas atuais e impostos do Brasil (IRPF, IOF).`;

const UNIFIED_MODEL_NAME = 'gemini-2.5-flash';

@Injectable()
export class AiAgentsService {
  private readonly logger = new Logger(AiAgentsService.name);
  private genAI: GoogleGenerativeAI;
  private unifiedModel: GenerativeModel;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OpenFinanceService))
    private readonly openFinanceService: OpenFinanceService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY não configurada. NEXFIN AI operando em modo Consultoria Local.');
      return;
    }
    this.genAI = new GoogleGenerativeAI(apiKey.trim());
    this.unifiedModel = this.genAI.getGenerativeModel({
      model: UNIFIED_MODEL_NAME, 
      systemInstruction: GLOBAL_SYSTEM_PROMPT,
    });
  }

  /**
   * Coleta dados financeiros reais do usuário para alimentar o prompt da IA.
   */
  private async getUserFinancialContext(userId: string): Promise<string> {
    this.logger.debug(`[getUserFinancialContext] Iniciando busca para userId=${userId}`);
    try {
      const [accounts, investments, transactions] = await Promise.all([
        this.openFinanceService.getUserAccounts(userId),
        this.openFinanceService.getInvestments(userId),
        this.openFinanceService.getTransactions(userId, { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }),
      ]);

      this.logger.debug(`[getUserFinancialContext] Contas: ${accounts.length}, Investimentos: ${investments.length}, Transações: ${transactions.length}`);

      let context = 'ESTADO ATUAL DO PATRIMÔNIO DO USUÁRIO:\n';
      
      if (accounts.length > 0) {
        context += '\nCONTAS BANCÁRIAS CONECTADAS:\n';
        accounts.forEach(acc => {
          context += `- ${acc.bankName} (${acc.accountType}): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: acc.currency }).format(acc.balance)}\n`;
        });
      }

      if (investments.length > 0) {
        context += '\nCARTEIRA DE INVESTIMENTOS:\n';
        investments.forEach(inv => {
          context += `- ${inv.name} (${inv.type}): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: inv.currency }).format(inv.balance)} (Rent. Anual: ${inv.annualRate ? (inv.annualRate * 100).toFixed(2) + '%' : 'N/A'})\n`;
        });
      }

      const recentTx = (transactions as any[]).slice(0, 10);
      if (recentTx.length > 0) {
        context += '\nÚLTIMAS 10 TRANSAÇÕES:\n';
        recentTx.forEach(tx => {
          const type = tx.amount > 0 ? 'ENTRADA' : 'SAÍDA';
          context += `- ${new Date(tx.date).toLocaleDateString('pt-BR')} | ${type} | ${tx.description}: R$ ${Math.abs(tx.amount).toFixed(2)} (${tx.bank})\n`;
        });
      }

      if (accounts.length === 0 && investments.length === 0) {
        this.logger.warn(`[getUserFinancialContext] Nenhum dado financeiro encontrado para o usuário ${userId}`);
        return 'O usuário ainda não vinculou nenhuma conta ou investimento ao sistema.';
      }

      return context;
    } catch (error) {
      this.logger.error(`Erro ao buscar contexto financeiro: ${error.message}`);
      return 'Não foi possível recuperar dados financeiros reais no momento devido a um erro interno.';
    }
  }

  /**
   * Envia mensagem para o Assistente Global NEXFIN
   */
  async chat(
    userId: string,
    agentName: AgentName, 
    userMessage: string,
    providedContext?: string,
    threadId?: string,
  ): Promise<string> {
    if (!this.unifiedModel) {
      return this.getUnifiedStubResponse(userMessage);
    }

    try {
      // 1. Coletar contexto real
      const realTimeContext = await this.getUserFinancialContext(userId);
      
      const finalPrompt = `
CONTEXTO DO SISTEMA (DADOS REAIS DO USUÁRIO):
${realTimeContext}

${providedContext ? `CONTEXTO ADICIONAL:\n${providedContext}\n` : ''}

MENSAGEM DO USUÁRIO:
${userMessage}

IMPORTANTE: Você TEM acesso aos dados acima. Se o contexto mostrar saldos, NÃO diga que não tem acesso. Use os valores de saldos, bancos e investimentos fornecidos para responder.`.trim();

      // 2. Chamar Gemini
      const result = await this.unifiedModel.generateContent(finalPrompt);
      const aiResponse = result.response.text();

      // 3. Persistir no banco de dados se houver threadId
      if (threadId) {
        await this.prisma.aiMessage.createMany({
          data: [
            { threadId, role: 'user', content: userMessage },
            { threadId, role: 'assistant', content: aiResponse },
          ],
        });
      }

      return aiResponse;
    } catch (error: any) {
      this.logger.error(`Erro no NEXFIN AI: ${error.message}`);
      return `❌ Erro de Conexão com a Inteligência: ${error.message}`;
    }
  }

  /**
   * CRUD de Threads
   */
  async listThreads(userId: string) {
    return this.prisma.aiThread.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });
  }

  async getThreadMessages(userId: string, threadId: string) {
    const thread = await this.prisma.aiThread.findUnique({
      where: { id: threadId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!thread) throw new Error('Conversa não encontrada');
    return thread.messages;
  }

  async createThread(userId: string, title: string) {
    return this.prisma.aiThread.create({
      data: { userId, title },
    });
  }

  async deleteThread(userId: string, threadId: string) {
    return this.prisma.aiThread.delete({
      where: { id: threadId, userId },
    });
  }

  /**
   * Análise automática de transações (Usa o mesmo cérebro global)
   */
  async analyzeTransactions(transactions: unknown[]): Promise<{
    anomalies: unknown[];
    duplicates: unknown[];
    insights: string;
  }> {
    if (!this.unifiedModel || transactions.length === 0) {
      return { anomalies: [], duplicates: [], insights: 'Sem transações para analisar ou modo offline ativo.' };
    }

    const prompt = `Analise estas ${transactions.length} transações recentes em busca de anomalias, duplicatas e insights de economia:\n\nDados: ${JSON.stringify(transactions.slice(0, 50))}`;

    const result = await this.unifiedModel.generateContent(prompt);
    return {
      anomalies: [],
      duplicates: [],
      insights: result.response.text(),
    };
  }

  /**
   * Projeção de patrimônio (Usa o mesmo cérebro global)
   */
  async projectNetWorth(financialData: {
    currentNetWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    investments: unknown[];
  }): Promise<string> {
    if (!this.unifiedModel) {
      return 'Conecte sua conta Premium (GEMINI_API_KEY) para ativar as projeções de longo prazo do Agente Galileu.';
    }

    const prompt = `Projete o patrimônio líquido para 2026-2031 com base nestes dados reais:
- Patrimônio: R$ ${financialData.currentNetWorth.toFixed(2)}
- Renda: R$ ${financialData.monthlyIncome.toFixed(2)}
- Gastos: R$ ${financialData.monthlyExpenses.toFixed(2)}
- Investimentos: ${JSON.stringify(financialData.investments)}

Forneça uma análise estratégica de crescimento.`;

    const result = await this.unifiedModel.generateContent(prompt);
    return result.response.text();
  }

  private getUnifiedStubResponse(userMessage: string): string {
    const msgLower = userMessage.toLowerCase();
    
    // Motor de Consultoria Local (Mock Pro)
    if (msgLower.includes('burn') || msgLower.includes('runway') || msgLower.includes('caixa')) {
      return `[NEXFIN AI - Local] Analisando seu caixa agora...\n\nComo seu consultor, notei que a prioridade deve ser estender seu RUNWAY. \nFórmula chave: (Saldo em Conta) / (Gastos Mensais - Receitas). \n\nSe você tiver R$ 100k e queima R$ 20k/mês, temos 5 meses para pivotar ou acelerar. Vamos olhar seus custos fixos agora?`;
    }
    
    if (msgLower.includes('ajuda') || msgLower.includes('startup') || msgLower.includes('ola') || msgLower.includes('oi')) {
      return `Olá! Sou o NEXFIN AI, seu novo assistente único. 👋\n\nUnifiquei a inteligência de todos os antigos agentes em uma só interface. Posso te ajudar com segurança, fluxo de caixa e estratégia tudo de uma vez. \n\nNo momento estou operando no meu módulo de consultoria local. O que vamos analisar hoje?`;
    }

    if (msgLower.includes('projeção') || msgLower.includes('futuro') || msgLower.includes('2031')) {
      return `[NEXFIN AI] Para projeções seguras até 2031, eu utilizo modelos complexos do Gemini 2.0. \nPara ativar essa funcionalidade premium, configure a **GEMINI_API_KEY** no seu ambiente. Por enquanto, posso te dizer que com a SELIC atual, manter capital em CDI é a base da sua segurança.`;
    }

    return `Entendido. Estou processando sua pergunta sobre "${userMessage}" através do meu motor de inteligência financeira. Para respostas baseadas em IA generativa profunda e análise de mercado global, lembre-se de conectar sua API do Gemini. \n\nComo posso ser útil nos seus próximos passos financeiros?`;
  }

  isAiActive(): boolean {
    return !!this.unifiedModel;
  }
}
