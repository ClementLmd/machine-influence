export interface Announcement {
  id: string;
  recruiterId: string;
  title: string;
  role: string;
  productionType: string;
  location: string;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementWithRecruiter extends Announcement {
  recruiter: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
}
