import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        bio: true,
        age: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(id: string, data: { name?: string; avatarUrl?: string; bio?: string; age?: number }) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
