import type { NextFunction, Request, Response } from "express";
import { embedPayload, extractPayload } from "../lib/steganography.js";

// ─── Encode ───────────────────────────────────────────────────────────────────

export async function encodeMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { imageBase64, payloadHex } = req.body as {
      imageBase64?: string;
      payloadHex?: string;
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      res.status(400).json({ error: "imageBase64 is required" });
      return;
    }
    if (!payloadHex || typeof payloadHex !== "string") {
      res.status(400).json({ error: "payloadHex is required" });
      return;
    }
    if (!/^[0-9a-fA-F]+$/.test(payloadHex)) {
      res.status(400).json({ error: "payloadHex must be valid hex" });
      return;
    }
    // Max 64 KB of raw bytes (hidden message + AES overhead)
    if (payloadHex.length > 131_072) {
      res.status(400).json({ error: "Payload too large (max 64 KB)" });
      return;
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");
    const stegoBuffer = await embedPayload(imageBuffer, payloadHex);

    res.status(200).json({
      data: { imageBase64: stegoBuffer.toString("base64") },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Decode ───────────────────────────────────────────────────────────────────

export async function decodeMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { imageBase64, imageUrl } = req.body as {
      imageBase64?: string;
      imageUrl?: string;
    };

    let imageBuffer: Buffer;

    if (imageBase64 && typeof imageBase64 === "string") {
      imageBuffer = Buffer.from(imageBase64, "base64");
    } else if (imageUrl && typeof imageUrl === "string") {
      const fetchRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10_000) });
      if (!fetchRes.ok) {
        res.status(400).json({ error: "Failed to fetch image from URL" });
        return;
      }
      const ab = await fetchRes.arrayBuffer();
      imageBuffer = Buffer.from(ab);
    } else {
      res.status(400).json({ error: "imageBase64 or imageUrl is required" });
      return;
    }

    const payloadHex = await extractPayload(imageBuffer);

    if (!payloadHex) {
      res.status(200).json({ data: { found: false, payloadHex: null } });
      return;
    }

    res.status(200).json({ data: { found: true, payloadHex } });
  } catch (err) {
    next(err);
  }
}
