export interface CreateAnnouncementDto {
  title: string;
  role: string;
  productionType: string;
  location: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  role?: string;
  productionType?: string;
  location?: string;
  isPaid?: boolean;
  startDate?: string;
  endDate?: string;
}
