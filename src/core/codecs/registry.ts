import { CodecModule } from '../types';

export class UnsupportedFormatError extends Error {
  constructor(format: string) {
    super(`Unsupported format: ${format}`);
    this.name = 'UnsupportedFormatError';
  }
}

const CODECS: Record<string, () => Promise<any>> = {
  jpg: () => import('./jpeg'),
  jpeg: () => import('./jpeg'),
  png: () => import('./png'),
  webp: () => import('./webp'),
  avif: () => import('./avif'),
  jxl: () => import('./jxl'),
  heic: () => import('./heic'),
  heif: () => import('./heic'),
  raw: () => import('./raw'),
  dng: () => import('./raw'),
  cr2: () => import('./raw'),
  cr3: () => import('./raw'),
  nef: () => import('./raw'),
  arw: () => import('./raw'),
  raf: () => import('./raw'),
  orf: () => import('./raw'),
  rw2: () => import('./raw'),
  svg: () => import('./svg'),
};

export async function getCodec(format: string): Promise<CodecModule> {
  const key = format.toLowerCase().trim();
  const loader = CODECS[key];
  if (!loader) {
    // If not a specialized wasm codec, check if canvas supports it
    return {
      encode: async (imageData: ImageData, options?: Record<string, any>) => {
        const { imageDataToCanvas, canvasToBlob } = await import('./native');
        const canvas = imageDataToCanvas(imageData);
        const mime = key === 'bmp' ? 'image/bmp' : key === 'gif' ? 'image/gif' : `image/${key}`;
        const blob = await canvasToBlob(canvas, mime, (options?.quality ?? 90) / 100);
        return await blob.arrayBuffer();
      },
    };
  }
  return loader();
}

