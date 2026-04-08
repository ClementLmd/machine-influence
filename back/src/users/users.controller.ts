import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Patch,
  Param,
  Query,
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
  IsEmail,
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
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

class GetAllQuery {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  minRate?: string;

  @IsOptional()
  @IsString()
  maxRate?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

class UpdateMeDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(1, 30, { each: true })
  skills?: string[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(5000)
  rate?: number;

  @IsOptional()
  @IsUrl({}, { message: 'portfolioUrl doit être une URL valide' })
  @MaxLength(500)
  portfolioUrl?: string | null;
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
    const user = await this.usersService.findBySupabaseId(supabaseId);
    if (!user) throw new NotFoundException('User not found');
    return user;
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

  @Get('featured')
  async getFeatured() {
    return this.usersService.findFeatured();
  }

  @Get()
  async getAll(@Query() query: GetAllQuery) {
    const skills = query.skills
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const page = query.page ? Math.max(1, parseInt(query.page, 10)) : 1;
    const limit = query.limit
      ? Math.min(50, Math.max(1, parseInt(query.limit, 10)))
      : 12;
    const minRate = query.minRate ? parseFloat(query.minRate) : undefined;
    const maxRate = query.maxRate ? parseFloat(query.maxRate) : undefined;
    return this.usersService.findAll({
      search: query.search,
      skills,
      role: query.role,
      minRate: minRate !== undefined && !isNaN(minRate) ? minRate : undefined,
      maxRate: maxRate !== undefined && !isNaN(maxRate) ? maxRate : undefined,
      page,
      limit,
    });
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
    if (file.mimetype && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Le fichier doit être une image');
    }
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

  @Post('me/cv')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCv(
    @Req() req: Request,
    @UploadedFile() file?: UploadedAvatarFile,
  ) {
    if (!req.user) throw new UnauthorizedException();
    if (!file) throw new BadRequestException('Missing file');
    if (file.mimetype && file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Le fichier doit être un PDF');
    }
    const { supabaseId } = req.user;
    const buffer: Buffer =
      file.buffer ?? (file.path ? await readFile(file.path) : Buffer.from([]));
    if (!buffer.length) throw new BadRequestException('Empty file');
    return this.usersService.uploadCv(supabaseId, {
      buffer,
      mimetype: 'application/pdf',
      originalname: file.originalname ?? 'cv.pdf',
    });
  }

  @Get(':id')
  async getPublic(@Param('id') id: string) {
    const user = await this.usersService.findPublicById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
