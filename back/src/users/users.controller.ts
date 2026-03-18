import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
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
    if (!req.user) throw new UnauthorizedException();
    const { supabaseId } = req.user;
    const email = req.user.email;
    if (!email) throw new UnauthorizedException('User email is missing');
    return this.usersService.create({ supabaseId, email, role: body.role });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: Request) {
    if (!req.user) throw new UnauthorizedException();
    const { supabaseId } = req.user;
    return this.usersService.findBySupabaseId(supabaseId);
  }
}
