import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const isFirebaseConfigured = firebaseConfig.apiKey.length > 0;

let _auth: Auth | null = null;

if (isFirebaseConfigured) {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  _auth = getAuth(app);
}

export const firebaseAuth: Auth | null = _auth;

export const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-phone-number": "Invalid phone number format.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/code-expired": "Verification code has expired.",
  "auth/invalid-verification-code": "Incorrect verification code.",
  "auth/user-disabled": "This account has been disabled.",
};
