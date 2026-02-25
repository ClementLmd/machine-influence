import type { CandidatureStatus } from '../enums';

export interface Candidature {
  id: string;
  annonceId: string;
  candidatId: string;
  message: string | null;
  status: CandidatureStatus;
  createdAt: string;
}
