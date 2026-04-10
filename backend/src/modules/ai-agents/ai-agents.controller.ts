import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { AiAgentsService, AgentName } from './ai-agents.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

class ChatDto {
  @IsEnum(['ALBERT', 'MARIE', 'GALILEU', 'FINN', 'NEXFIN_AI'], { message: 'Agente inválido' })
  @IsNotEmpty({ message: 'O nome do agente é obrigatório' })
  agentName: string;

  @IsString({ message: 'A mensagem deve ser um texto' })
  @IsNotEmpty({ message: 'A mensagem não pode estar vazia' })
  message: string;

  @IsString({ message: 'O contexto deve ser um texto' })
  @IsOptional()
  context?: string;

  @IsString({ message: 'O ID da conversa deve ser um texto' })
  @IsOptional()
  threadId?: string;
}

@Controller('ai-agents')
export class AiAgentsController {
  constructor(private readonly aiAgentsService: AiAgentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatDto, @Req() req) {
    const userId = req.user.id;
    const response = await this.aiAgentsService.chat(
      userId,
      dto.agentName as AgentName,
      dto.message,
      dto.context,
      dto.threadId,
    );
    return {
      agent: dto.agentName,
      message: response,
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('threads')
  async getThreads(@Req() req) {
    return this.aiAgentsService.listThreads(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('threads/:id')
  async getThreadMessages(@Param('id') id: string, @Req() req) {
    return this.aiAgentsService.getThreadMessages(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('threads')
  async createThread(@Body() body: { title: string }, @Req() req) {
    return this.aiAgentsService.createThread(req.user.id, body.title);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('threads/:id')
  async deleteThread(@Param('id') id: string, @Req() req) {
    return this.aiAgentsService.deleteThread(req.user.id, id);
  }

  @Post('analyze-transactions')
  @HttpCode(HttpStatus.OK)
  async analyzeTransactions(@Body() body: { transactions: unknown[] }) {
    return this.aiAgentsService.analyzeTransactions(body.transactions);
  }

  @Post('project-net-worth')
  @HttpCode(HttpStatus.OK)
  async projectNetWorth(@Body() body: {
    currentNetWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    investments: unknown[];
  }) {
    const projection = await this.aiAgentsService.projectNetWorth(body);
    return { projection, timestamp: new Date().toISOString() };
  }

  @UseGuards(JwtAuthGuard)
  @Post('status')
  @HttpCode(HttpStatus.OK)
  async getStatus() {
    return { active: this.aiAgentsService.isAiActive() };
  }
}
