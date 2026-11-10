# PixelCraft — Premium Light Editorial Image Utility & Deep Metadata Engine

> **Universal Image Utility:** Any image. Any format. Your metadata rules.  
> 100% in-browser, zero-telemetry, local WebAssembly image processing utility built with a warm editorial design system.

---

## Overview

PixelCraft bridges the gap between precision digital photography utilities and privacy-focused sanitization engines. Built around a refined, light editorial design system inspired by classic print photography journals, PixelCraft executes all operations client-side in memory:

* **Zero Cloud Dispatch:** All processing happens in your browser tab via WebAssembly codecs (LibRaw, libheif, libjpeg, libpng, libwebp, libavif) and Web Workers.
* **Format Breadth:** Native support for Web standard formats (JPEG, PNG, WebP, AVIF), next-gen codecs (JPEG XL), Apple mobile containers (HEIC/HEIF, ProRAW DNG), camera RAWs (CR2, CR3, NEF, ARW, RAF, ORF, RW2), animated GIF/APNG, and vector SVG.
* **Multi-Layer Deep Metadata Engine:** Format-aware binary scanning inspecting Layer A (Standard EXIF, XMP, IPTC), Layer B (JPEG APP0–15, PNG chunks, WebP RIFF, ISO-BMFF box trees), and Layer C (Application & AI traces such as ComfyUI node graphs, Stable Diffusion prompt/seed parameters, and C2PA Content Credentials).
* **3-Mode Processing Pipeline:**
  * **Mode 1: Safe (Metadata-Only):** Whitelist-based binary container reconstruction for byte-identical pixel stream preservation (zero generational loss).
  * **Mode 2: Disrupt (Watermark Perturbation):** Quality-gated imperceptible spatial & frequency perturbation targeting invisible AI watermarks like SynthID without visual degradation ($\text{PSNR} > 45\text{ dB}$).
  * **Mode 3: High-Quality Conversion:** Full multi-format conversion using WebAssembly codecs with precision quality sliders.
* **Independent Binary Verification:** Post-sanitization audit re-scanning output containers to independently verify that personal and GPS metadata have been eliminated and image geometry/decodability remain intact.
* **Batch Operations & In-Memory ZIP:** Drag and drop dozens of files, process synchronously in the background, and download verified archives instantly via `fflate`.

---

## Design System

* **Surfaces:** Clean, warm paper tones (`#F8F9F8`, `#FFFFFF`, `#F1F3F1`, `#EAF2EC`)
* **Typography:** `DM Serif Display` (editorial headlines), `Manrope` (display typography), `Inter` (body copy), and `IBM Plex Mono` (technical badges & metrics)
* **Accent:** Restrained Forest Green (`#426B54`, soft `#DCEADF`, hover `#355844`)
* **Philosophy:** Borders over shadows (`1px solid #E7EAE7`), generous whitespace, small radii (6px–14px), and zero decorative gradients.

---

## Deployment to Vercel

PixelCraft is pre-configured for instant zero-configuration deployment to **Vercel**:

* `vercel.json` includes required SPA rewrites to `/index.html`.
* Headers configured for `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` to enable multi-threaded WebAssembly execution.

### Local Development

```bash
# Install dependencies
npm install

# Run automated deep metadata test suite
node scripts/run-suite.mjs

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## License

MIT License. Designed and engineered for photographers, designers, and privacy advocates.
