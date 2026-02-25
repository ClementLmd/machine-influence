/**
 * DTOs for auth - to be extended in EPIC 1 with LoginDto, RegisterDto, UserResponse
 */

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: 'RECRUITER' | 'INDEPENDENT';
}

export interface UserResponse {
  id: string;
  supabaseId: string;
  email: string;
  role: string;
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
