/**
 * RAW camera format decoder (DNG, CR2, CR3, NEF, ARW, RAF, ORF, RW2)
 * Features dual-path:
 *  1. Ultra-fast embedded preview extraction (10-30ms)
 *  2. Full LibRaw / rawconvert-wasm demosaicing
 */

export async function extractRawEmbeddedPreview(file: File | Blob): Promise<Blob | null> {
  const buffer = await file.slice(0, Math.min(file.size, 16 * 1024 * 1024)).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Search for JPEG SOI marker (FF D8 FF E1 or FF D8 FF DB or FF D8 FF E0)
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      // Find matching EOI marker (FF D9)
      for (let j = i + 1024; j < bytes.length - 1; j++) {
        if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
          const jpegSlice = bytes.slice(i, j + 2);
          // Only accept previews larger than 32KB to avoid tiny 160x120 thumbnails
          if (jpegSlice.length > 32 * 1024) {
            return new Blob([jpegSlice], { type: 'image/jpeg' });
          }
        }
      }
    }
  }
  return null;
}

export async function decodeRaw(
  file: File,
  options?: { mode?: 'preview' | 'full' }
): Promise<ImageData> {
  // If preview mode requested or as first fast-path
  if (options?.mode === 'preview') {
    const previewBlob = await extractRawEmbeddedPreview(file);
    if (previewBlob) {
      const { decodeWithNative } = await import('./native');
      return await decodeWithNative(previewBlob);
    }
  }

  try {
    // Attempt rawconvert-wasm worker
    const { RawConvertWorker } = await import('rawconvert-wasm/dist/worker-client.js');
    const worker = await RawConvertWorker.init({
      workerUrl: '/wasm/rawconvert/worker.js',
      coreUrl: '/wasm/rawconvert/rawconvert-core.js',
      wasmUrl: '/wasm/rawconvert/rawconvert-core.wasm',
    });

    const buffer = await file.arrayBuffer();
    await worker.load(buffer, file.name);
    const processed = await worker.process({
      colorSpace: 'srgb',
      halfSize: false,
    });

    worker.dispose();

    return new ImageData(
      new Uint8ClampedArray(processed.data),
      processed.width,
      processed.height
    );
  } catch (err) {
    console.warn('[PixelCraft] LibRaw worker full develop failed, falling back to embedded preview:', err);
    const previewBlob = await extractRawEmbeddedPreview(file);
    if (previewBlob) {
      const { decodeWithNative } = await import('./native');
      return await decodeWithNative(previewBlob);
    }
    throw new Error(`Failed to decode RAW file ${file.name}: ${(err as Error).message}`);
  }
}

