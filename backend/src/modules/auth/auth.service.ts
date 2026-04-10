import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../../common/services/mail.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly RECAPTCHA_SECRET = "6LcZF6osAAAAAKmkDMPCQLe90oLDssyHk8ZqzPd8";

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, recaptchaToken } = registerDto;

    // 🛡️ Validação Oficial do Google reCAPTCHA
    await this.validateRecaptcha(recaptchaToken);

    // Verificar se o usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Usuário com este e-mail já cadastrado.');
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    // Gerar token para login automático
    const payload = { sub: user.id, email: user.email };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, recaptchaToken } = loginDto;

    // 🛡️ Validação Oficial do Google reCAPTCHA
    await this.validateRecaptcha(recaptchaToken);

    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Gerar token
    const payload = { sub: user.id, email: user.email };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  private async validateRecaptcha(token: string) {
    try {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${this.RECAPTCHA_SECRET}&response=${token}`;
      const recaptchaResponse = await axios.post<{ success: boolean }>(verifyUrl);
      
      if (!recaptchaResponse.data.success) {
        throw new UnauthorizedException('Falha na verificação de segurança (reCAPTCHA inválido).');
      }
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Falha na comunicação com o serviço de segurança.');
    }
  }

  async validateUser(payload: any) {
    return await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por segurança, não informamos se o e-mail existe ou não
      return { message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' };
    }

    // Gerar token aleatório
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora de expiração

    // Salvar no banco
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpires,
      },
    });

    // Enviar e-mail (ou logar em dev)
    await this.mailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Buscar usuário pelo token e verificar expiração
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Token de recuperação inválido ou expirado.');
    }

    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Atualizar senha e limpar tokens
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Senha redefinida com sucesso. Agora você pode fazer login.' };
  }
}
