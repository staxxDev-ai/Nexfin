import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req) {
    // req.user contém o id e email vindos do JwtAuthGuard/Strategy
    return this.usersService.findOne(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateData: { name?: string; avatarUrl?: string; bio?: string; age?: number }) {
    // Sanitização simples da idade (converter string para number se necessário)
    if (updateData.age) {
      updateData.age = Number(updateData.age);
    }
    return this.usersService.updateProfile(req.user.userId, updateData);
  }
}
