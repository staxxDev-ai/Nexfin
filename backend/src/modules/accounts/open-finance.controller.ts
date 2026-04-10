import {
  Controller, Post, Body, Get, Param, UseGuards, Req, Query,
  HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { OpenFinanceService } from './open-finance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('accounts/open-finance')
export class OpenFinanceController {
  constructor(private readonly openFinanceService: OpenFinanceService) {}

  /**
   * Lista as contas bancárias conectadas do usuário autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @Get('accounts')
  async getUserAccounts(@Req() req) {
    const userId = req.user.id;
    return this.openFinanceService.getUserAccounts(userId);
  }

  /**
   * Retorna o extrato de transações do usuário autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getTransactions(
    @Req() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('bank') bank?: string,
  ) {
    const userId = req.user.id;
    return this.openFinanceService.getTransactions(userId, { startDate, endDate, bank });
  }

  /**
   * Retorna a lista de investimentos do usuário autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @Get('investments')
  async getInvestments(@Req() req) {
    const userId = req.user.id;
    return this.openFinanceService.getInvestments(userId);
  }

  /**
   * Retorna um resumo dos saldos consolidados por moeda para o Dashboard.
   */
  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async getSummary(@Req() req) {
    const userId = req.user.id;
    return this.openFinanceService.getSummary(userId);
  }

  /**
   * Valida as credenciais Pluggy sem salvá-las.
   * Útil para um teste rápido antes do fluxo de setup.
   */
  @UseGuards(JwtAuthGuard)
  @Post('validate-credentials')
  @HttpCode(HttpStatus.OK)
  async validateCredentials(@Body() body: { clientId: string; clientSecret: string }) {
    if (!body.clientId || !body.clientSecret) {
      throw new BadRequestException('clientId e clientSecret são obrigatórios.');
    }
    return this.openFinanceService.validateCredentials(body.clientId, body.clientSecret);
  }

  /**
   * Salva as credenciais Pluggy do usuário após validação real com a API.
   * Retorna erro 400 se as credenciais forem inválidas.
   */
  @UseGuards(JwtAuthGuard)
  @Post('credentials')
  @HttpCode(HttpStatus.OK)
  async saveCredentials(@Req() req, @Body() body: { clientId: string; clientSecret: string }) {
    const userId = req.user.id;
    if (!body.clientId || !body.clientSecret) {
      throw new BadRequestException('clientId e clientSecret são obrigatórios.');
    }
    await this.openFinanceService.saveCredentials(userId, body.clientId, body.clientSecret);
    return { message: 'Credenciais da Pluggy validadas e salvas com sucesso.' };
  }

  /**
   * Gera um Connect Token para o widget Pluggy Connect (frontend).
   */
  @UseGuards(JwtAuthGuard)
  @Post('connect-token')
  @HttpCode(HttpStatus.OK)
  async createConnectToken(@Req() req) {
    const userId = req.user.id;
    const accessToken = await this.openFinanceService.createConnectToken(userId);
    return { accessToken };
  }

  /**
   * Vincula uma nova conexão Pluggy (itemId) ao usuário logado.
   * Chamado pelo frontend após o callback onSuccess do widget.
   */
  @UseGuards(JwtAuthGuard)
  @Post('link')
  @HttpCode(HttpStatus.OK)
  async linkAccount(@Req() req, @Body() body: { itemId: string }) {
    const userId = req.user.id;
    if (!body.itemId) {
      throw new BadRequestException('itemId é obrigatório.');
    }
    await this.openFinanceService.linkConnection(userId, body.itemId);
    return { message: 'Conexão bancária estabelecida e sincronizada com sucesso.' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/sync')
  async syncAccount(@Param('id') accountId: string) {
    await this.openFinanceService.syncAccount(accountId);
    return { message: 'Sincronização iniciada com sucesso.' };
  }

  /**
   * Sincroniza todas as contas do usuário em background.
   */
  @UseGuards(JwtAuthGuard)
  @Post('sync-all')
  @HttpCode(HttpStatus.ACCEPTED)
  async syncAll(@Req() req) {
    const userId = req.user.id;
    // Iniciamos o sync em background (não aguardamos a conclusão)
    this.openFinanceService.syncAllUserAccounts(userId).catch(err => {
      this.logger.error(`[syncAll Controller] Erro no sync background: ${err.message}`);
    });
    
    return { 
      message: 'Sincronização global iniciada em background.',
      status: 'ACCEPTED'
    };
  }

  /**
   * Endpoint público para receber Webhooks da Pluggy.
   * Não possui JwtAuthGuard pois as requisições vêm da API externa.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    // Processamento em background para não travar a resposta para a Pluggy
    this.openFinanceService.handleWebhook(payload).catch(err => {
       console.error(`[Webhook Controller] Erro no processamento: ${err.message}`);
    });
    
    return { received: true };
  }

  /**
   * Verifica se o usuário já tem credenciais salvas.
   */
  @UseGuards(JwtAuthGuard)
  @Get('check-credentials')
  async checkCredentials(@Req() req) {
    const hasCredentials = await this.openFinanceService.hasCredentials(req.user.id);
    return { hasCredentials };
  }

  /**
   * Smoke test técnico para validar integração (remover em produção).
   */
  @Get('smoke-test')
  async smokeTest() {
    const service = this.openFinanceService as any;
    let user = await service.prisma.user.findFirst();

    if (!user) {
      user = await service.prisma.user.create({
        data: {
          email: 'smoke@nexfin.com.br',
          name: 'Smoke Tester',
          auth0Id: 'smoke|' + Date.now(),
        },
      });
    }

    const token = await this.openFinanceService.createConnectToken(user.id);

    return {
      message: 'Smoke test concluído com sucesso!',
      user: { id: user.id, name: user.name },
      token,
      hint: 'Verifique os logs da aplicação para o rastro de auditoria.',
    };
  }
}
