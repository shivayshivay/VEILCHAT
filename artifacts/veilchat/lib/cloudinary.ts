import { env, isCloudinaryEnvConfigured } from "@/src/config/env";

export interface UploadResult {
  url: string;
  publicId: string;
  isLocal: boolean;
}

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
};

function mimeFor(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  return MIME_MAP[ext] ?? "image/jpeg";
}

function resourceTypeFor(mime: string): "image" | "video" | "auto" {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  return "auto";
}

/**
 * Upload a local file URI to Cloudinary.
 * Falls back to returning the original URI if Cloudinary is not configured.
 */
export async function uploadMedia(localUri: string): Promise<UploadResult> {
  if (!isCloudinaryEnvConfigured) {
    console.warn("[cloudinary] Not configured — using local URI as fallback");
    return { url: localUri, publicId: "", isLocal: true };
  }

  const { cloudName, uploadPreset } = env.cloudinary;
  if (!uploadPreset) {
    console.warn("[cloudinary] EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET not set");
    return { url: localUri, publicId: "", isLocal: true };
  }

  const mime = mimeFor(localUri);
  const resourceType = resourceTypeFor(mime);
  const filename = localUri.split("/").pop() ?? `media_${Date.now()}`;

  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    name: filename,
    type: mime,
  } as unknown as Blob);
  formData.append("upload_preset", uploadPreset);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const response = await fetch(uploadUrl, { method: "POST", body: formData });
  if (!response.ok) {
    const text = await response.text().catch(() => "unknown error");
    throw new Error(`Cloudinary upload failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  return {
    url: json.secure_url as string,
    publicId: json.public_id as string,
    isLocal: false,
  };
}

/**
 * Upload a raw base64 PNG (e.g. steganography output) to Cloudinary
 * using a data URL.  Returns the secure URL or null on failure.
 */
export async function uploadBase64Png(base64: string): Promise<string | null> {
  if (!isCloudinaryEnvConfigured) return null;

  const { cloudName, uploadPreset } = env.cloudinary;
  if (!uploadPreset) return null;

  const dataUrl = `data:image/png;base64,${base64}`;
  const formData = new FormData();
  formData.append("file", dataUrl);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json.secure_url as string) ?? null;
  } catch {
    return null;
  }
}
