import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

let _initialized = false;

function getFirebaseApp() {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  if (!_initialized) {
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      _initialized = true;
      logger.info("Firebase Admin initialized");
    }
  }

  const { getApp } = require("firebase-admin/app");
  return getApp();
}

export function isFirebaseConfigured(): boolean {
  return !!(
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_CLIENT_EMAIL &&
    env.FIREBASE_PRIVATE_KEY
  );
}

export async function verifyFirebaseIdToken(idToken: string) {
  const app = getFirebaseApp();
  if (!app) throw new Error("Firebase Admin is not configured");

  const { getAuth } = require("firebase-admin/auth");
  return getAuth(app).verifyIdToken(idToken);
}

export async function sendPushNotification(
  fcmToken: string,
  notification: { title: string; body: string },
  data?: Record<string, string>
) {
  const app = getFirebaseApp();
  if (!app) throw new Error("Firebase Admin is not configured");

  const { getMessaging } = require("firebase-admin/messaging");
  return getMessaging(app).send({
    token: fcmToken,
    notification,
    data,
    android: { priority: "high" },
    apns: { payload: { aps: { contentAvailable: true } } },
  });
}
