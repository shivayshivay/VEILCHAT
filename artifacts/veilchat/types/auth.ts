export interface VeilUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  bio: string;
  avatarColor: string;
  avatarUrl?: string;
  isVerified?: boolean;
  createdAt: number;
  firebaseUid?: string;
  supabaseId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: VeilUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingPhone: string;
  error: string | null;
  tokens: AuthTokens | null;
}

export type AuthAction =
  | "login"
  | "otp"
  | "profile-setup"
  | "authenticated"
  | "logout";
