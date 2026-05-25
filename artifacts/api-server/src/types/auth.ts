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
