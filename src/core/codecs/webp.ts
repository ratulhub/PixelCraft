import encodeWebp from '@jsquash/webp/encode';
import decodeWebp from '@jsquash/webp/decode';

export async function encode(
  imageData: ImageData,
  options?: { quality?: number; lossless?: boolean }
): Promise<ArrayBuffer> {
  const quality = options?.quality ?? 85;
  const lossless = options?.lossless ?? false;
  try {
    return await encodeWebp(imageData, { quality, lossless: lossless ? 1 : 0 });
  } catch (err) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw err;
    ctx.putImageData(imageData, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality / 100)
    );
    if (!blob) throw err;
    return await blob.arrayBuffer();
  }
}

export async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  return await decodeWebp(buffer);
}

