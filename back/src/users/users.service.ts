import { ConflictException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async create(data: { supabaseId: string; email: string; role: UserRole }) {
    const existing = await this.prisma.user.findUnique({
      where: { supabaseId: data.supabaseId },
    });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    return this.prisma.user.create({
      data: {
        supabaseId: data.supabaseId,
        email: data.email,
        role: data.role,
      },
    });
  }

  async findBySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }

  async findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        description: true,
        skills: true,
        rate: true,
        portfolioUrl: true,
        cvUrl: true,
        isProfileComplete: true,
        createdAt: true,
      },
    });
  }

  async findAll(options: {
    search?: string;
    skills?: string[];
    role?: UserRole;
    minRate?: number;
    maxRate?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      skills,
      role,
      minRate,
      maxRate,
      page = 1,
      limit = 12,
    } = options;

    const rateFilter: { gte?: number; lte?: number } = {};
    if (minRate !== undefined) rateFilter.gte = minRate;
    if (maxRate !== undefined) rateFilter.lte = maxRate;

    const trimmedSearch = search?.trim();
    const normalizedSkills =
      skills
        ?.map((skill) => skill.trim().toLocaleLowerCase())
        .filter(Boolean) ?? [];

    const where = {
      isProfileComplete: true,
      ...(role && { role }),
      ...(Object.keys(rateFilter).length && { rate: rateFilter }),
      ...(trimmedSearch && {
        OR: [
          {
            firstName: {
              contains: trimmedSearch,
              mode: 'insensitive' as const,
            },
          },
          {
            lastName: {
              contains: trimmedSearch,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: trimmedSearch,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const select = {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
      description: true,
      skills: true,
      rate: true,
      portfolioUrl: true,
      cvUrl: true,
      isProfileComplete: true,
      createdAt: true,
    };

    if (normalizedSkills.length) {
      const matchingUsers = await this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select,
      });

      const filteredUsers = matchingUsers.filter((user) => {
        const userSkills = user.skills.map((skill) =>
          skill.trim().toLocaleLowerCase(),
        );
        return normalizedSkills.some((skill) =>
          userSkills.some((userSkill) => userSkill.includes(skill)),
        );
      });

      return {
        users: filteredUsers.slice((page - 1) * limit, page * limit),
        total: filteredUsers.length,
        page,
        limit,
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async findFeatured(limit = 4) {
    return this.prisma.user.findMany({
      where: { isProfileComplete: true, role: UserRole.CANDIDATE },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        description: true,
        skills: true,
        rate: true,
        isProfileComplete: true,
      },
    });
  }

  async updateMe(
    supabaseId: string,
    data: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      description?: string | null;
      skills?: string[];
      rate?: number | null;
      portfolioUrl?: string | null;
    },
  ) {
    const current = await this.prisma.user.findUnique({
      where: { supabaseId },
    });
    if (!current) {
      return null;
    }

    const next = {
      email:
        data.email !== undefined && data.email !== null
          ? data.email
          : current.email,
      firstName:
        data.firstName !== undefined ? data.firstName : current.firstName,
      lastName: data.lastName !== undefined ? data.lastName : current.lastName,
      description:
        data.description !== undefined ? data.description : current.description,
      skills: data.skills !== undefined ? data.skills : current.skills,
      rate: data.rate !== undefined ? data.rate : current.rate,
      portfolioUrl:
        data.portfolioUrl !== undefined
          ? data.portfolioUrl
          : current.portfolioUrl,
    };

    const isProfileComplete =
      !!(next.firstName && next.firstName.trim()) &&
      !!(next.lastName && next.lastName.trim()) &&
      !!(next.description && next.description.trim()) &&
      Array.isArray(next.skills) &&
      next.skills.length > 0;

    return this.prisma.user.update({
      where: { supabaseId },
      data: {
        ...next,
        isProfileComplete,
      },
    });
  }

  async uploadCv(
    supabaseId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const bucket = process.env.SUPABASE_AVATARS_BUCKET ?? 'avatars';
    const path = `users/${supabaseId}/cv.pdf`;

    const { error: uploadError } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);

    return this.prisma.user.update({
      where: { supabaseId },
      data: { cvUrl: data.publicUrl },
    });
  }

  async uploadAvatar(
    supabaseId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    const bucket = process.env.SUPABASE_AVATARS_BUCKET ?? 'avatars';
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const safeExt = ext && /^[a-z0-9]+$/.test(ext) ? ext : 'png';
    const path = `users/${supabaseId}/avatar.${safeExt}`;

    const { error: uploadError } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    return this.prisma.user.update({
      where: { supabaseId },
      data: { profilePicture: publicUrl },
    });
  }
}
