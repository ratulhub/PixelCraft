import encodePng from '@jsquash/png/encode';
import decodePng from '@jsquash/png/decode';

export async function encode(imageData: ImageData): Promise<ArrayBuffer> {
  try {
    return await encodePng(imageData);
  } catch (err) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw err;
    ctx.putImageData(imageData, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) throw err;
    return await blob.arrayBuffer();
  }
}

export async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  return await decodePng(buffer);
}

