import { getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { env, isFirebaseEnvConfigured } from "./env";

const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
} as const;

function initFirebase() {
  if (!isFirebaseEnvConfigured) {
    console.warn("[firebase] Firebase is not configured — skipping initialization");
    return null;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    return app;
  } catch (error) {
    console.error("[firebase] Initialization error:", error);
    return null;
  }
}

const firebaseApp = initFirebase();

let _auth: Auth | null = null;

if (firebaseApp) {
  try {
    _auth = getAuth(firebaseApp);
  } catch (error) {
    console.error("[firebase] Failed to get Auth instance:", error);
  }
}

export const firebaseAuth: Auth | null = _auth;

export { isFirebaseEnvConfigured as isFirebaseConfigured };

export const FIREBASE_ERRORS: Record<string, string> = {
  "auth/invalid-phone-number": "Invalid phone number format.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/code-expired": "Verification code has expired.",
  "auth/invalid-verification-code": "Incorrect verification code.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/session-expired": "Session has expired. Please log in again.",
  "auth/missing-phone-number": "Phone number is required.",
  "auth/quota-exceeded": "SMS quota exceeded. Try again later.",
};
