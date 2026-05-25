const required = (key: string): string => {
  const value = process.env[key] ?? "";
  if (value.length === 0) {
    console.warn(`[env] Missing environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback = ""): string =>
  process.env[key] ?? fallback;

export const env = {
  firebase: {
    apiKey: required("EXPO_PUBLIC_FIREBASE_API_KEY"),
    authDomain: required("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: required("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: required("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: required("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: required("EXPO_PUBLIC_FIREBASE_APP_ID"),
  },

  supabase: {
    url: required("EXPO_PUBLIC_SUPABASE_URL"),
    anonKey: required("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  },

  api: {
    baseUrl: optional("EXPO_PUBLIC_API_URL", ""),
    socketUrl: optional("EXPO_PUBLIC_SOCKET_URL", ""),
  },

  cloudinary: {
    cloudName: optional("EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME"),
    uploadPreset: optional("EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET"),
  },
} as const;

export const isFirebaseEnvConfigured: boolean = env.firebase.apiKey.length > 0;

export const isSupabaseEnvConfigured: boolean =
  env.supabase.url.length > 0 && env.supabase.anonKey.length > 0;

export const isSocketEnvConfigured: boolean = env.api.socketUrl.length > 0;

export const isCloudinaryEnvConfigured: boolean =
  env.cloudinary.cloudName.length > 0;
