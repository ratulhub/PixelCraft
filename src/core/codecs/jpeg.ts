import encodeJpeg, { init as initJpegEncode } from '@jsquash/jpeg/encode';
import decodeJpeg, { init as initJpegDecode } from '@jsquash/jpeg/decode';

export async function encode(
  imageData: ImageData,
  options?: { quality?: number }
): Promise<ArrayBuffer> {
  const quality = options?.quality ?? 85;
  try {
    return await encodeJpeg(imageData, { quality });
  } catch (err) {
    // Canvas fallback
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw err;
    ctx.putImageData(imageData, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality / 100)
    );
    if (!blob) throw err;
    return await blob.arrayBuffer();
  }
}

export async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  return await decodeJpeg(buffer);
}

