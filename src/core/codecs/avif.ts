import encodeAvif from '@jsquash/avif/encode';
import decodeAvif from '@jsquash/avif/decode';

export async function encode(
  imageData: ImageData,
  options?: { quality?: number }
): Promise<ArrayBuffer> {
  const quality = options?.quality ?? 75;
  return await encodeAvif(imageData, { quality });
}

export async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  const result = await decodeAvif(buffer);
  if (!result) throw new Error('AVIF decode returned null');
  return result;
}
