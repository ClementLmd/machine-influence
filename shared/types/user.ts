import type { UserRole } from '../enums';

export interface User {
  id: string;
  supabaseId: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  description: string | null;
  skills: string[];
  rate: number | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  description: string | null;
  skills: string[];
  rate: number | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  isProfileComplete: boolean;
  createdAt: string;
}
