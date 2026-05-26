import { env } from "@/src/config/env";

// ─── Hex / Byte helpers ───────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── AES-256-GCM (Web Crypto API — available in Expo / Hermes ≥ 0.73) ────────

export async function encryptPayload(
  plaintext: string,
  keyHex: string,
): Promise<string> {
  const keyBytes = hexToBytes(keyHex);
  const textBytes = new TextEncoder().encode(plaintext);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    textBytes,
  );

  // Layout: iv(12) || ciphertext
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  return bytesToHex(combined);
}

export async function decryptPayload(
  encryptedHex: string,
  keyHex: string,
): Promise<string | null> {
  try {
    const keyBytes = hexToBytes(keyHex);
    const combined = hexToBytes(encryptedHex);
    if (combined.length < 13) return null;

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      "AES-GCM",
      false,
      ["decrypt"],
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

// ─── Image → Base64 (Expo FileSystem) ────────────────────────────────────────

export async function localUriToBase64(uri: string): Promise<string> {
  // Dynamic import so it only runs on native (web has fetch/blob)
  if (uri.startsWith("data:")) {
    return uri.split(",")[1] ?? "";
  }
  if (uri.startsWith("http")) {
    // Remote URL — fetch and convert
    const res = await fetch(uri);
    const ab = await res.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }
  // Local file URI (native only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FileSystem = (await import("expo-file-system")) as any;
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function apiBase(): string {
  return env.api.baseUrl ? `${env.api.baseUrl}/adaptive` : "";
}

/**
 * Encrypt `message` client-side, then send image + ciphertext to server for
 * LSB steganography. Returns the stego image as base64, or null on failure.
 */
export async function encodeImageWithMessage(
  imageLocalUri: string,
  message: string,
  keyHex: string,
  accessToken: string,
): Promise<string | null> {
  const base = apiBase();
  if (!base) return null;

  try {
    const [imageBase64, payloadHex] = await Promise.all([
      localUriToBase64(imageLocalUri),
      encryptPayload(message, keyHex),
    ]);

    const res = await fetch(`${base}/encode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ imageBase64, payloadHex }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.imageBase64 ?? null;
  } catch {
    return null;
  }
}

/**
 * Ask server to extract LSB payload from an image URL, then decrypt
 * the result with the user's local key. Returns plaintext or null.
 */
export async function scanImageForMessage(
  imageUrl: string,
  keyHex: string,
  accessToken: string,
): Promise<string | null> {
  const base = apiBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/decode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!res.ok) return null;
    const json = await res.json();

    if (!json.data?.found || !json.data?.payloadHex) return null;
    return decryptPayload(json.data.payloadHex, keyHex);
  } catch {
    return null;
  }
}
