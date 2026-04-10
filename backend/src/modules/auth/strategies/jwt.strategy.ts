import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'nexfin_secret_key_2026',
    });
  }

  async validate(payload: any) {
    // Retorna os dados do usuário para serem usados em req.user
    // IMPORTANTE: `id` e `userId` apontam para o mesmo valor (sub do JWT)
    // Controllers legados usam req.user.id, novos usam req.user.userId
    return { id: payload.sub, userId: payload.sub, email: payload.email };
  }
}
