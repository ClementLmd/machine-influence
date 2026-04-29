import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

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
}
