import type { App } from "firebase-admin/app";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

let _app: App | null = null;
let _initialized = false;

async function getFirebaseApp(): Promise<App | null> {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  if (!_initialized) {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    if (getApps().length === 0) {
      _app = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      logger.info("Firebase Admin initialized");
    } else {
      const { getApp } = await import("firebase-admin/app");
      _app = getApp();
    }
    _initialized = true;
  }

  return _app;
}

export function isFirebaseConfigured(): boolean {
  return !!(
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_CLIENT_EMAIL &&
    env.FIREBASE_PRIVATE_KEY
  );
}

export async function verifyFirebaseIdToken(idToken: string) {
  const app = await getFirebaseApp();
  if (!app) throw new Error("Firebase Admin is not configured");

  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(app).verifyIdToken(idToken);
}

export async function sendPushNotification(
  fcmToken: string,
  notification: { title: string; body: string },
  data?: Record<string, string>
) {
  const app = await getFirebaseApp();
  if (!app) throw new Error("Firebase Admin is not configured");

  const { getMessaging } = await import("firebase-admin/messaging");
  return getMessaging(app).send({
    token: fcmToken,
    notification,
    data,
    android: { priority: "high" },
    apns: { payload: { aps: { contentAvailable: true } } },
  });
}
