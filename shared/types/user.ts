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
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  email?: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  description: string | null;
  skills: string[];
  rate: number | null;
}
