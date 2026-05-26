---
name: Steganography image hosting — do not use Cloudinary
description: Cloudinary re-encodes images on upload which destroys LSB steganographic data
---

## Rule
Steganography-encoded (stego) images from the Adaptive Enhancement system must NOT be uploaded to Cloudinary. Cloudinary optimizes and re-encodes images (even PNGs) which wipes out the least-significant-bit payload.

**Why:** VEILCHAT's Adaptive Enhancement embeds encrypted payloads in the LSBs of R,G,B pixel channels. Any lossy or lossless re-encoding that reorganizes pixel data destroys the payload. Cloudinary applies this by default.

**How to apply:**
- Stego images → Supabase Storage (raw file upload, no re-encoding) OR base64 data URIs (for demo/dev)
- Regular media (photos, videos) → Cloudinary (fine, no hidden data)
- Current MVP implementation uses `data:image/png;base64,...` data URIs to avoid hosting dependency
- Production path: Supabase Storage bucket `stego-images` with public read access
