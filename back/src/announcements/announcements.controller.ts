import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
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
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

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

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    if (!req.user) throw new UnauthorizedException();

    // Get the announcement to check ownership
    const announcement = await this.announcementsService.findOne(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
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

    // Check if the user is the owner of the announcement
    if (announcement.recruiterId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres annonces',
      );
    }

    // Validate dates if provided
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate
        ? new Date(dto.startDate)
        : new Date(announcement.startDate);
      const endDate = dto.endDate
        ? new Date(dto.endDate)
        : new Date(announcement.endDate);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new BadRequestException(
          "La date de début ne peut pas être antérieure à aujourd'hui",
        );
      }

      if (endDate <= startDate) {
        throw new BadRequestException(
          'La date de fin doit être postérieure à la date de début',
        );
      }
    }

    return this.announcementsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  async delete(@Req() req: Request, @Param('id') id: string) {
    if (!req.user) throw new UnauthorizedException();

    // Get the announcement to check ownership
    const announcement = await this.announcementsService.findOne(id);
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
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

    // Check if the user is the owner of the announcement
    if (announcement.recruiterId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres annonces',
      );
    }

    await this.announcementsService.delete(id);

    return { message: 'Annonce supprimée avec succès' };
  }
}
