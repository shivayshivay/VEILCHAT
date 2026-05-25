export interface JWTPayload {
  sub: string;
  phone?: string;
  email?: string;
  name: string;
  iat: number;
  exp: number;
  type: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse extends TokenPair {
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerify {
  phone: string;
  otp: string;
  firebaseToken?: string;
}

export type CreateTokenPayload = Omit<JWTPayload, "iat" | "exp" | "type">;

export type DevicePlatform = "ios" | "android" | "web";

export interface DeviceInfo {
  deviceId: string;
  platform: DevicePlatform;
  fcmToken?: string | null;
  lastSeen: string;
  registeredAt: string;
}

export interface DeviceSession {
  userId: string;
  deviceId: string;
  platform: DevicePlatform;
  fcmToken?: string | null;
  lastSeen: string;
  registeredAt: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  username: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  isVerified: boolean;
  isOnline: boolean;
  createdAt: Date;
}

export interface FirebaseVerifyPayload {
  uid: string;
  phone?: string;
  email?: string;
  name?: string;
  picture?: string;
}
