---
name: Sharp usage in the API server esbuild bundle
description: Sharp is already pre-listed as external in build.mjs — no config changes needed
---

## Rule
When adding `sharp` as a dependency to `artifacts/api-server`, no changes to `build.mjs` are needed. It is already in the `external` array.

**Why:** The esbuild config at `artifacts/api-server/build.mjs` has a comprehensive external list including `"sharp"` on line ~33, placed there to handle native binaries that can't be bundled. Sharp uses native `.node` binaries.

**How to apply:**
- `pnpm --filter @workspace/api-server add sharp` → install
- `pnpm approve-builds` → needed to approve sharp's native build scripts (interactive)
- Import with `import sharp from 'sharp'` in TypeScript — works in ESM bundle
- Sharp outputs: use `.ensureAlpha().raw().toBuffer({ resolveWithObject: true })` for pixel access
