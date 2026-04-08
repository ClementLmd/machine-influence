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
        isProfileComplete: true,
        createdAt: true,
      },
    });
  }

  async findFeatured(limit = 4) {
    return this.prisma.user.findMany({
      where: { isProfileComplete: true },
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
    },
  ) {
    const current = await this.prisma.user.findUnique({
      where: { supabaseId },
    });
    if (!current) {
      return null;
    }

    const next = {
      email: data.email ?? current.email,
      firstName: data.firstName ?? current.firstName,
      lastName: data.lastName ?? current.lastName,
      description: data.description ?? current.description,
      skills: data.skills ?? current.skills,
      rate: data.rate ?? current.rate,
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
