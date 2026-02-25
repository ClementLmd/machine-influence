import type { AnnonceStatus } from '../enums';

export interface Annonce {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  skills: string[];
  location: string | null;
  budget: number | null;
  status: AnnonceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AnnonceWithRecruiter extends Annonce {
  recruiter: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
}
