import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(recruiterId: string, dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        recruiterId,
        title: dto.title,
        role: dto.role,
        productionType: dto.productionType,
        location: dto.location,
        isPaid: dto.isPaid,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: {
        recruiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async findAll(limit?: number) {
    const announcements = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        recruiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    return announcements;
  }

  async findOne(id: string) {
    return this.prisma.announcement.findUnique({
      where: { id },
      include: {
        recruiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async findByRecruiterId(recruiterId: string) {
    return this.prisma.announcement.findMany({
      where: { recruiterId },
      orderBy: { createdAt: 'desc' },
      include: {
        recruiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const data: {
      title?: string;
      role?: string;
      productionType?: string;
      location?: string;
      isPaid?: boolean;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.productionType !== undefined)
      data.productionType = dto.productionType;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.isPaid !== undefined) data.isPaid = dto.isPaid;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);

    return this.prisma.announcement.update({
      where: { id },
      data,
      include: {
        recruiter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
