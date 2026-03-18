import { ConflictException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { supabaseId: string; email: string; role: UserRole }) {
    const existing = await this.prisma.user.findUnique({
      where: { supabaseId: data.supabaseId },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    return this.prisma.user.create({
      data: {
        supabaseId: data.supabaseId,
        email: data.email,
        role: data.role,
      },
    });
  }

  async findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }
}
