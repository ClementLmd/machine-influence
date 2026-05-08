import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

const mockFindAll = jest.fn();
const mockFindByRecruiterId = jest.fn();
const mockCreate = jest.fn();
const mockFindOne = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUserFindUnique = jest.fn();

describe('AnnouncementsController', () => {
  let controller: AnnouncementsController;

  const mockReq = {
    user: { supabaseId: 'supabase-id', email: 'recruiter@example.com' },
  } as unknown as Request;

  const createDto = {
    title: 'Court-métrage cherche cadreur',
    role: 'Cadreur',
    productionType: 'Court-métrage',
    location: 'Rouen',
    isPaid: true,
    startDate: '2099-01-10',
    endDate: '2099-01-12',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [
        {
          provide: AnnouncementsService,
          useValue: {
            findAll: mockFindAll,
            findByRecruiterId: mockFindByRecruiterId,
            create: mockCreate,
            findOne: mockFindOne,
            update: mockUpdate,
            delete: mockDelete,
            prisma: {
              user: {
                findUnique: mockUserFindUnique,
              },
            },
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnnouncementsController>(AnnouncementsController);
  });

  describe('findAll', () => {
    it('returns all announcements when no recruiterId is provided', async () => {
      mockFindAll.mockResolvedValue(['announcement']);

      const result = await controller.findAll('4');

      expect(result).toEqual(['announcement']);
      expect(mockFindAll).toHaveBeenCalledWith(4);
      expect(mockFindByRecruiterId).not.toHaveBeenCalled();
    });

    it('returns recruiter announcements when recruiterId is provided', async () => {
      mockFindByRecruiterId.mockResolvedValue(['own-announcement']);

      const result = await controller.findAll(undefined, ' recruiter-1 ');

      expect(result).toEqual(['own-announcement']);
      expect(mockFindByRecruiterId).toHaveBeenCalledWith('recruiter-1');
      expect(mockFindAll).not.toHaveBeenCalled();
    });

    it('rejects invalid limits', async () => {
      await expect(controller.findAll('0')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create', () => {
    it('creates an announcement when the recruiter profile is complete', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'recruiter-1',
        isProfileComplete: true,
      });
      mockCreate.mockResolvedValue({ id: 'announcement-1' });

      const result = await controller.create(mockReq, createDto);

      expect(result).toEqual({ id: 'announcement-1' });
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { supabaseId: 'supabase-id' },
        select: { id: true, isProfileComplete: true },
      });
      expect(mockCreate).toHaveBeenCalledWith('recruiter-1', createDto);
    });

    it('rejects announcement creation when profile is incomplete', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'recruiter-1',
        isProfileComplete: false,
      });

      await expect(controller.create(mockReq, createDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('rejects creation when the database user is missing', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(controller.create(mockReq, createDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
