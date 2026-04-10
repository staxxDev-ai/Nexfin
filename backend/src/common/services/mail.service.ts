import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        auth: { user, pass },
      });
      this.logger.log(`[MailService] Transmissor SMTP configurado para ${host}:${port}`);
    } else {
      this.logger.warn('[MailService] Credenciais SMTP não encontradas. O serviço operará em modo LOG (apenas console).');
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const from = this.configService.get<string>('MAIL_FROM') || 'support@nexfin.com.br';

    const subject = 'Recuperação de Senha - NEXFIN';
    const text = `Você solicitou a redefinição de sua senha no NEXFIN. Clique no link abaixo para prosseguir:\n\n${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Recuperação de Senha</h2>
        <p>Você solicitou a redefinição de sua senha no <strong>NEXFIN</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
        </div>
        <p style="font-size: 0.9em; color: #666;">Se o botão não funcionar, cole o link abaixo no seu navegador:</p>
        <p style="font-size: 0.8em; color: #2563eb; word-break: break-all;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 0.8em; color: #999;">Este link expira em 1 hora. Se você não solicitou esta alteração, por favor ignore este e-mail.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject,
          text,
          html,
        });
        this.logger.log(`[MailService] E-mail de recuperação enviado para: ${email}`);
      } catch (error: any) {
        this.logger.error(`[MailService] Falha ao enviar e-mail: ${error.message}`);
        // Em desenvolvimento, ainda logamos o link para não travar o fluxo
        this.logger.warn(`[DEVELOPMENT ONLY] Link de reset: ${resetUrl}`);
      }
    } else {
      this.logger.log('--- E-MAIL DE RECUPERAÇÃO (SIMULADO) ---');
      this.logger.log(`Para: ${email}`);
      this.logger.log(`Assunto: ${subject}`);
      this.logger.log(`Link: ${resetUrl}`);
      this.logger.log('---------------------------------------');
    }
  }
}
