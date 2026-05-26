import sharp from "sharp";

const MAGIC_0 = 0xae;
const MAGIC_1 = 0x42;
const HEADER_BYTES = 6; // 2 magic + 4 payload-length

/**
 * Embed arbitrary bytes into the LSBs of R,G,B channels of a PNG image.
 * Header: [0xAE, 0x42, len(4 bytes big-endian)] then payload bytes.
 * Skips the alpha channel to avoid transparency artefacts.
 */
export async function embedPayload(
  imageBuffer: Buffer,
  payloadHex: string,
): Promise<Buffer> {
  const payload = Buffer.from(payloadHex, "hex");

  // Build full data blob: magic(2) + length(4) + payload
  const header = Buffer.allocUnsafe(HEADER_BYTES);
  header[0] = MAGIC_0;
  header[1] = MAGIC_1;
  header.writeUInt32BE(payload.length, 2);
  const fullData = Buffer.concat([header, payload]);

  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels; // always 4 after ensureAlpha
  const bitsNeeded = fullData.length * 8;
  const bitsAvailable = info.width * info.height * 3; // 3 usable channels per pixel

  if (bitsNeeded > bitsAvailable) {
    throw new Error(
      `Image too small for payload. Need ${bitsNeeded} bits, have ${bitsAvailable} bits (${info.width}×${info.height}px).`,
    );
  }

  // Write one bit per RGB channel (skip alpha = channel index 3)
  let slot = 0; // which RGB slot we are on (0=R₀, 1=G₀, 2=B₀, 3=R₁ …)
  for (let byteIdx = 0; byteIdx < fullData.length; byteIdx++) {
    for (let bitPos = 7; bitPos >= 0; bitPos--) {
      const bit = (fullData[byteIdx] >> bitPos) & 1;
      const pixelIdx = Math.floor(slot / 3);
      const channelInPixel = slot % 3; // 0=R, 1=G, 2=B
      const dataIdx = pixelIdx * ch + channelInPixel;
      data[dataIdx] = (data[dataIdx] & 0xfe) | bit;
      slot++;
    }
  }

  return sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: ch },
  })
    .png({ compressionLevel: 6 })
    .toBuffer();
}

/**
 * Extract embedded payload from a stego image.
 * Returns the payload as a hex string, or null if no valid header is found.
 */
export async function extractPayload(
  imageBuffer: Buffer,
): Promise<string | null> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const maxSlots = info.width * info.height * 3;

  function readBytes(numBytes: number, startSlot: number): Buffer {
    const buf = Buffer.alloc(numBytes);
    for (let i = 0; i < numBytes * 8; i++) {
      const slot = startSlot + i;
      if (slot >= maxSlots) break;
      const pixelIdx = Math.floor(slot / 3);
      const channelInPixel = slot % 3;
      const dataIdx = pixelIdx * ch + channelInPixel;
      const bit = data[dataIdx] & 1;
      const byteIdx = Math.floor(i / 8);
      const bitPos = 7 - (i % 8);
      buf[byteIdx] |= bit << bitPos;
    }
    return buf;
  }

  // Read header (6 bytes = 48 bits starting at slot 0)
  const header = readBytes(HEADER_BYTES, 0);

  if (header[0] !== MAGIC_0 || header[1] !== MAGIC_1) return null;

  const payloadLength = header.readUInt32BE(2);
  if (payloadLength === 0 || payloadLength > 500_000) return null;

  const bitsRequired = (HEADER_BYTES + payloadLength) * 8;
  if (bitsRequired > maxSlots) return null;

  const payloadBuffer = readBytes(payloadLength, HEADER_BYTES * 8);
  return payloadBuffer.toString("hex");
}
