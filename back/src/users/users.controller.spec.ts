import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

import { AuthGuard } from '../auth/auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Standalone jest.fn() variables avoid @typescript-eslint/unbound-method when
// used in expect() calls (no class-method 'this' binding concern).
const mockCreate = jest.fn();
const mockFindBySupabaseId = jest.fn();
const mockUpdateMe = jest.fn();
const mockFindFeatured = jest.fn();
const mockFindAll = jest.fn();
const mockUploadAvatar = jest.fn();
const mockUploadCv = jest.fn();
const mockFindPublicById = jest.fn();

describe('UsersController', () => {
  let controller: UsersController;

  const mockUser = {
    id: 'user-id',
    supabaseId: 'supabase-id',
    email: 'test@example.com',
    role: UserRole.INDEPENDENT,
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

  const mockReq = {
    user: { supabaseId: 'supabase-id', email: 'test@example.com' },
  } as unknown as Request;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: mockCreate,
            findBySupabaseId: mockFindBySupabaseId,
            updateMe: mockUpdateMe,
            findFeatured: mockFindFeatured,
            findAll: mockFindAll,
            uploadAvatar: mockUploadAvatar,
            uploadCv: mockUploadCv,
            findPublicById: mockFindPublicById,
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('create', () => {
    it('should create a user and return it', async () => {
      mockCreate.mockResolvedValue(mockUser);

      const result = await controller.create(mockReq, {
        role: UserRole.INDEPENDENT,
      });
      expect(result).toEqual(mockUser);
      expect(mockCreate).toHaveBeenCalledWith({
        supabaseId: 'supabase-id',
        email: 'test@example.com',
        role: UserRole.INDEPENDENT,
      });
    });

    it('should throw UnauthorizedException when req.user is missing', async () => {
      const emptyReq = { user: null } as unknown as Request;
      await expect(
        controller.create(emptyReq, { role: UserRole.INDEPENDENT }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when email is missing from token', async () => {
      const reqWithoutEmail = {
        user: { supabaseId: 'supabase-id', email: undefined },
      } as unknown as Request;
      await expect(
        controller.create(reqWithoutEmail, { role: UserRole.INDEPENDENT }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return the current authenticated user', async () => {
      mockFindBySupabaseId.mockResolvedValue(mockUser);

      const result = await controller.getMe(mockReq);
      expect(result).toEqual(mockUser);
      expect(mockFindBySupabaseId).toHaveBeenCalledWith('supabase-id');
    });

    it('should throw NotFoundException if user does not exist in DB', async () => {
      mockFindBySupabaseId.mockResolvedValue(null);

      await expect(controller.getMe(mockReq)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException when req.user is missing', async () => {
      const emptyReq = { user: null } as unknown as Request;
      await expect(controller.getMe(emptyReq)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateMe', () => {
    it('should update and return the user', async () => {
      mockUpdateMe.mockResolvedValue({ ...mockUser, firstName: 'Jane' });

      const result = await controller.updateMe(mockReq, { firstName: 'Jane' });
      expect(result).toMatchObject({ firstName: 'Jane' });
      expect(mockUpdateMe).toHaveBeenCalledWith(
        'supabase-id',
        expect.objectContaining({ firstName: 'Jane' }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUpdateMe.mockResolvedValue(null);

      await expect(
        controller.updateMe(mockReq, { firstName: 'Jane' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when req.user is missing', async () => {
      const emptyReq = { user: null } as unknown as Request;
      await expect(
        controller.updateMe(emptyReq, { firstName: 'Jane' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getFeatured', () => {
    it('should return the list of featured users', async () => {
      mockFindFeatured.mockResolvedValue([mockUser]);

      const result = await controller.getFeatured();
      expect(result).toEqual([mockUser]);
      expect(mockFindFeatured).toHaveBeenCalled();
    });

    it('should return an empty array when no featured users exist', async () => {
      mockFindFeatured.mockResolvedValue([]);

      const result = await controller.getFeatured();
      expect(result).toEqual([]);
    });
  });

  describe('getAll', () => {
    const mockPaginated = { users: [mockUser], total: 1, page: 1, limit: 12 };

    it('should return all candidates with default pagination', async () => {
      mockFindAll.mockResolvedValue(mockPaginated);

      const result = await controller.getAll({});
      expect(result).toEqual(mockPaginated);
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 12 }),
      );
    });

    it('should pass the keyword search to the service', async () => {
      mockFindAll.mockResolvedValue(mockPaginated);

      await controller.getAll({ search: 'director' });
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'director' }),
      );
    });

    it('should parse and pass skills filter to service', async () => {
      mockFindAll.mockResolvedValue({ ...mockPaginated, users: [] });

      await controller.getAll({ skills: 'React,TypeScript' });
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ skills: ['React', 'TypeScript'] }),
      );
    });

    it('should parse and pass role filter to service', async () => {
      mockFindAll.mockResolvedValue(mockPaginated);

      await controller.getAll({ role: UserRole.INDEPENDENT });
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.INDEPENDENT }),
      );
    });

    it('should parse minRate and maxRate as floats', async () => {
      mockFindAll.mockResolvedValue(mockPaginated);

      await controller.getAll({ minRate: '300', maxRate: '800' });
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ minRate: 300, maxRate: 800 }),
      );
    });

    it('should pass undefined for non-numeric rate values', async () => {
      mockFindAll.mockResolvedValue(mockPaginated);

      await controller.getAll({ minRate: 'abc' });
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ minRate: undefined }),
      );
    });

    it('should clamp page to minimum 1', async () => {
      mockFindAll.mockResolvedValue(mockPaginated);

      await controller.getAll({ page: '-5' });
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });

    it('should clamp limit to maximum 50', async () => {
      mockFindAll.mockResolvedValue(mockPaginated);

      await controller.getAll({ limit: '999' });
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50 }),
      );
    });

    it('should ignore empty skill entries after splitting', async () => {
      mockFindAll.mockResolvedValue(mockPaginated);

      await controller.getAll({ skills: 'React,,TypeScript,' });
      expect(mockFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ skills: ['React', 'TypeScript'] }),
      );
    });
  });

  describe('uploadCv', () => {
    it('should upload a PDF and return updated user', async () => {
      const updatedUser = { ...mockUser, cvUrl: 'https://example.com/cv.pdf' };
      mockUploadCv.mockResolvedValue(updatedUser);

      const file = {
        buffer: Buffer.from('fake-pdf'),
        mimetype: 'application/pdf',
        originalname: 'cv.pdf',
      };

      const result = await controller.uploadCv(mockReq, file);
      expect(result).toEqual(updatedUser);
      expect(mockUploadCv).toHaveBeenCalledWith('supabase-id', {
        buffer: file.buffer,
        mimetype: 'application/pdf',
        originalname: 'cv.pdf',
      });
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(controller.uploadCv(mockReq, undefined)).rejects.toThrow('Missing file');
    });

    it('should throw BadRequestException when file is not a PDF', async () => {
      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/png',
        originalname: 'photo.png',
      };
      await expect(controller.uploadCv(mockReq, file)).rejects.toThrow(
        'Le fichier doit être un PDF',
      );
    });

    it('should throw UnauthorizedException when req.user is missing', async () => {
      const emptyReq = { user: null } as unknown as Request;
      const file = { buffer: Buffer.from('pdf'), mimetype: 'application/pdf', originalname: 'cv.pdf' };
      await expect(controller.uploadCv(emptyReq, file)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getPublic', () => {
    it('should return a public user profile by id', async () => {
      mockFindPublicById.mockResolvedValue(mockUser);

      const result = await controller.getPublic('user-id');
      expect(result).toEqual(mockUser);
      expect(mockFindPublicById).toHaveBeenCalledWith('user-id');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockFindPublicById.mockResolvedValue(null);

      await expect(controller.getPublic('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar and return updated user', async () => {
      const updatedUser = {
        ...mockUser,
        profilePicture: 'https://example.com/avatar.png',
      };
      mockUploadAvatar.mockResolvedValue(updatedUser);

      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/png',
        originalname: 'avatar.png',
      };

      const result = await controller.uploadAvatar(mockReq, file);
      expect(result).toEqual(updatedUser);
      expect(mockUploadAvatar).toHaveBeenCalledWith('supabase-id', {
        buffer: file.buffer,
        mimetype: 'image/png',
        originalname: 'avatar.png',
      });
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(controller.uploadAvatar(mockReq, undefined)).rejects.toThrow(
        'Missing file',
      );
    });

    it('should throw BadRequestException when file is not an image', async () => {
      const file = {
        buffer: Buffer.from('fake-data'),
        mimetype: 'application/pdf',
        originalname: 'document.pdf',
      };

      await expect(controller.uploadAvatar(mockReq, file)).rejects.toThrow(
        'Le fichier doit être une image',
      );
    });

    it('should throw UnauthorizedException when req.user is missing', async () => {
      const emptyReq = { user: null } as unknown as Request;
      const file = {
        buffer: Buffer.from('img'),
        mimetype: 'image/png',
        originalname: 'a.png',
      };
      await expect(controller.uploadAvatar(emptyReq, file)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
