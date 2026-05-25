import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

let _configured = false;

function ensureConfigured(): void {
  if (_configured) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  _configured = true;
  logger.info("Cloudinary configured");
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  );
}

export type MediaFolder = "avatars" | "chat-media" | "documents" | "voice";

export interface UploadOptions {
  folder?: MediaFolder;
  publicId?: string;
  transformation?: Record<string, unknown>[];
  resourceType?: "image" | "video" | "raw" | "auto";
}

export async function uploadBuffer(
  buffer: Buffer,
  options: UploadOptions = {}
) {
  ensureConfigured();
  const { folder = "chat-media", publicId, transformation, resourceType = "auto" } = options;

  return new Promise<{ publicId: string; secureUrl: string; bytes: number; format: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `veilchat/${folder}`,
          public_id: publicId,
          transformation,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            bytes: result.bytes,
            format: result.format,
          });
        }
      );
      stream.end(buffer);
    }
  );
}

export async function uploadFromUrl(url: string, options: UploadOptions = {}) {
  ensureConfigured();
  const { folder = "chat-media", publicId, resourceType = "auto" } = options;

  const result = await cloudinary.uploader.upload(url, {
    folder: `veilchat/${folder}`,
    public_id: publicId,
    resource_type: resourceType,
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    bytes: result.bytes,
    format: result.format,
  };
}

export async function deleteMedia(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId);
}

export function generateTransformedUrl(
  publicId: string,
  transformations: Record<string, unknown> = {}
): string {
  ensureConfigured();
  return cloudinary.url(publicId, { secure: true, ...transformations });
}

export function generateThumbnailUrl(publicId: string, width = 200, height = 200): string {
  return generateTransformedUrl(publicId, {
    width,
    height,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  });
}
