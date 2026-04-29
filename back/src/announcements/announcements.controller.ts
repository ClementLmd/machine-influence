import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  async findAll(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    if (limit && (isNaN(limitNum!) || limitNum! <= 0)) {
      throw new BadRequestException('Invalid limit parameter');
    }
    return this.announcementsService.findAll(limitNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const announcement = await this.announcementsService.findOne(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  async create(@Req() req: Request, @Body() dto: CreateAnnouncementDto) {
    if (!req.user) throw new UnauthorizedException();

    // Validate that startDate is not in the past
    const startDate = new Date(dto.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException(
        "La date de début ne peut pas être antérieure à aujourd'hui",
      );
    }

    // Validate that endDate is after startDate
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException(
        'La date de fin doit être postérieure à la date de début',
      );
    }

    // Get the user ID from the database
    const { supabaseId } = req.user;
    const user = await this.announcementsService['prisma'].user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.announcementsService.create(user.id, dto);
  }
}
