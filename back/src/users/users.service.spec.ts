/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createClient } from '@supabase/supabase-js';
import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

const candidateRole = 'CANDIDATE' as UserRole;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/avatar.png' },
        }),
      }),
    },
  }),
}));

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-id',
    supabaseId: 'supabase-id',
    email: 'test@example.com',
    role: candidateRole,
    firstName: 'John',
    lastName: 'Doe',
    profilePicture: null,
    description: 'A developer',
    skills: ['React', 'TypeScript'],
    rate: 500,
    portfolioUrl: null,
    cvUrl: null,
    isProfileComplete: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        supabaseId: 'supabase-id',
        email: 'test@example.com',
        role: candidateRole,
      });

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          supabaseId: 'supabase-id',
          email: 'test@example.com',
          role: candidateRole,
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({
          supabaseId: 'supabase-id',
          email: 'test@example.com',
          role: candidateRole,
        }),
      ).rejects.toThrow(ConflictException);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findBySupabaseId', () => {
    it('should return a user by supabaseId', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findBySupabaseId('supabase-id');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { supabaseId: 'supabase-id' },
      });
    });

    it('should return null if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.findBySupabaseId('unknown-id');
      expect(result).toBeNull();
    });
  });

  describe('findPublicById', () => {
    it('should return public user data by id', async () => {
      const publicFields = {
        id: mockUser.id,
        role: mockUser.role,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        profilePicture: mockUser.profilePicture,
        description: mockUser.description,
        skills: mockUser.skills,
        rate: mockUser.rate,
        isProfileComplete: mockUser.isProfileComplete,
        createdAt: mockUser.createdAt,
      };
      prismaMock.user.findUnique.mockResolvedValue(publicFields);

      const result = await service.findPublicById('user-id');
      expect(result).toEqual(publicFields);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-id' } }),
      );
    });

    it('should return null if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.findPublicById('unknown-id');
      expect(result).toBeNull();
    });
  });

  describe('findFeatured', () => {
    it('should return featured users (default limit 4)', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.findFeatured();
      expect(result).toEqual([mockUser]);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isProfileComplete: true },
          take: 4,
        }),
      );
    });

    it('should respect a custom limit', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser, mockUser]);

      await service.findFeatured(2);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users with total count', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result).toEqual({
        users: [mockUser],
        total: 1,
        page: 1,
        limit: 12,
      });
    });

    it('should filter by role', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      await service.findAll({ role: candidateRole });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: candidateRole }),
        }),
      );
    });

    it('should filter by partial skills case-insensitively', async () => {
      const matchingUser = { ...mockUser, skills: ['Photographie', 'Portrait'] };
      const otherUser = { ...mockUser, id: 'other-user', skills: ['Vue'] };
      prismaMock.user.findMany.mockResolvedValue([matchingUser, otherUser]);

      const result = await service.findAll({ skills: ['pho'] });

      expect(result.users).toEqual([matchingUser]);
      expect(result.total).toBe(1);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isProfileComplete: true },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(prismaMock.user.count).not.toHaveBeenCalled();
    });

    it('should not add skills filter when skills array is empty', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ skills: [] });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isProfileComplete: true },
        }),
      );
    });

    it('should search case-insensitively in firstName, lastName and description', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      await service.findAll({ search: 'developer' });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { firstName: { contains: 'developer', mode: 'insensitive' } },
              { lastName: { contains: 'developer', mode: 'insensitive' } },
              { description: { contains: 'developer', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should ignore a blank search string', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ search: '   ' });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ OR: expect.anything() }),
        }),
      );
    });

    it('should apply a minimum rate filter', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      await service.findAll({ minRate: 300 });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rate: { gte: 300 } }),
        }),
      );
    });

    it('should apply a maximum rate filter', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      await service.findAll({ maxRate: 800 });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rate: { lte: 800 } }),
        }),
      );
    });

    it('should apply both minRate and maxRate as a combined range filter', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockUser]);
      prismaMock.user.count.mockResolvedValue(1);

      await service.findAll({ minRate: 300, maxRate: 800 });
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rate: { gte: 300, lte: 800 } }),
        }),
      );
    });

    it('should apply pagination with skip and take', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 3, limit: 10 });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });
  });

  describe('updateMe', () => {
    it('should update the user profile and return the updated user', async () => {
      const current = {
        ...mockUser,
        firstName: null,
        lastName: null,
        description: null,
        skills: [],
      };
      prismaMock.user.findUnique.mockResolvedValue(current);
      prismaMock.user.update.mockResolvedValue(mockUser);

      const result = await service.updateMe('supabase-id', {
        firstName: 'John',
        lastName: 'Doe',
        description: 'A developer',
        skills: ['React'],
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.updateMe('unknown-id', {
        firstName: 'John',
      });
      expect(result).toBeNull();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should set isProfileComplete to true when all required fields are present', async () => {
      const current = {
        ...mockUser,
        firstName: null,
        lastName: null,
        description: null,
        skills: [],
      };
      prismaMock.user.findUnique.mockResolvedValue(current);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        isProfileComplete: true,
      });

      await service.updateMe('supabase-id', {
        firstName: 'John',
        lastName: 'Doe',
        description: 'A developer',
        skills: ['React'],
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isProfileComplete: true }),
        }),
      );
    });

    it('should set isProfileComplete to false when required fields are missing', async () => {
      const current = {
        ...mockUser,
        firstName: null,
        lastName: null,
        description: null,
        skills: [],
      };
      prismaMock.user.findUnique.mockResolvedValue(current);
      prismaMock.user.update.mockResolvedValue({
        ...current,
        rate: 600,
        isProfileComplete: false,
      });

      await service.updateMe('supabase-id', { rate: 600 });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isProfileComplete: false }),
        }),
      );
    });

    it('should keep existing field values when not provided in the update', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, rate: 600 });

      await service.updateMe('supabase-id', { rate: 600 });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            description: mockUser.description,
            skills: mockUser.skills,
          }),
        }),
      );
    });

    it('should save a portfolioUrl when provided', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        portfolioUrl: 'https://portfolio.example.com',
      });

      await service.updateMe('supabase-id', {
        portfolioUrl: 'https://portfolio.example.com',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            portfolioUrl: 'https://portfolio.example.com',
          }),
        }),
      );
    });

    it('should clear portfolioUrl when explicitly set to null', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        portfolioUrl: 'https://portfolio.example.com',
      });
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        portfolioUrl: null,
      });

      await service.updateMe('supabase-id', { portfolioUrl: null });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ portfolioUrl: null }),
        }),
      );
    });
  });

  describe('uploadCv', () => {
    it('should upload a PDF to Supabase Storage and save the public URL as cvUrl', async () => {
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        cvUrl: 'https://example.com/avatar.png',
      });

      const result = await service.uploadCv('supabase-id', {
        buffer: Buffer.from('fake-pdf'),
        mimetype: 'application/pdf',
        originalname: 'cv.pdf',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { supabaseId: 'supabase-id' },
          data: { cvUrl: 'https://example.com/avatar.png' },
        }),
      );
      expect(result).toMatchObject({
        cvUrl: 'https://example.com/avatar.png',
      });
    });
  });

  describe('uploadAvatar', () => {
    it('should upload the file to Supabase Storage and update the user profile picture', async () => {
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        profilePicture: 'https://example.com/avatar.png',
      });

      const result = await service.uploadAvatar('supabase-id', {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/png',
        originalname: 'avatar.png',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { supabaseId: 'supabase-id' },
          data: { profilePicture: 'https://example.com/avatar.png' },
        }),
      );
      expect(result.profilePicture).toBe('https://example.com/avatar.png');
    });

    it('should throw if Supabase Storage upload fails', async () => {
      jest.mocked(createClient).mockReturnValueOnce({
        storage: {
          from: jest.fn().mockReturnValue({
            upload: jest
              .fn()
              .mockResolvedValue({ error: new Error('Upload failed') }),
            getPublicUrl: jest.fn(),
          }),
        },
      } as unknown as ReturnType<typeof createClient>);

      const freshModule = await Test.createTestingModule({
        providers: [
          UsersService,
          { provide: PrismaService, useValue: { user: { update: jest.fn() } } },
        ],
      }).compile();

      const freshService = freshModule.get<UsersService>(UsersService);

      await expect(
        freshService.uploadAvatar('supabase-id', {
          buffer: Buffer.from('fake-image'),
          mimetype: 'image/png',
          originalname: 'avatar.png',
        }),
      ).rejects.toThrow('Upload failed');
    });
  });
});
