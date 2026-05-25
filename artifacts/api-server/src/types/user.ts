export type UserStatus = "active" | "inactive" | "banned" | "deleted";

export interface PublicUserProfile {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  isOnline: boolean;
  lastSeen: Date | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface PrivateUserProfile extends PublicUserProfile {
  phone: string | null;
  email: string | null;
  status: UserStatus;
  updatedAt: Date;
}
