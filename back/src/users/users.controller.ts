import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsEnum } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

class CreateUserDto {
  @IsEnum(UserRole)
  role: UserRole;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Req() req: Request, @Body() body: CreateUserDto) {
    const { supabaseId, email } = (req as any).user;
    return this.usersService.create({ supabaseId, email, role: body.role });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: Request) {
    const { supabaseId } = (req as any).user;
    return this.usersService.findBySupabaseId(supabaseId);
  }
}
