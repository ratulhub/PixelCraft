import encodeJxl from '@jsquash/jxl/encode';
import decodeJxl from '@jsquash/jxl/decode';

export async function encode(
  imageData: ImageData,
  options?: { quality?: number; lossless?: boolean }
): Promise<ArrayBuffer> {
  const quality = options?.quality ?? 85;
  const lossless = options?.lossless ?? false;
  return await encodeJxl(imageData, { quality, lossless });
}

export async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  return await decodeJxl(buffer);
}

