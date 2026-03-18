import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Patch,
  Param,
  Req,
  UploadedFile,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import type { Request } from 'express';
import { readFile } from 'node:fs/promises';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

type UploadedAvatarFile = {
  buffer?: Buffer;
  path?: string;
  mimetype?: string;
  originalname?: string;
};

class CreateUserDto {
  @IsEnum(UserRole)
  role: UserRole;
}

class UpdateMeDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsNumber()
  rate?: number;
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

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(@Req() req: Request, @Body() body: UpdateMeDto) {
    if (!req.user) throw new UnauthorizedException();
    const { supabaseId } = req.user;
    const updated = await this.usersService.updateMe(supabaseId, body);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  @Post('me/avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file?: UploadedAvatarFile,
  ) {
    if (!req.user) throw new UnauthorizedException();
    if (!file) throw new BadRequestException('Missing file');
    const { supabaseId } = req.user;
    const buffer: Buffer =
      file.buffer ?? (file.path ? await readFile(file.path) : Buffer.from([]));
    if (!buffer.length) throw new BadRequestException('Empty file');
    return this.usersService.uploadAvatar(supabaseId, {
      buffer,
      mimetype: file.mimetype ?? 'application/octet-stream',
      originalname: file.originalname ?? 'avatar',
    });
  }

  @Get(':id')
  async getPublic(@Param('id') id: string) {
    const user = await this.usersService.findPublicById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
