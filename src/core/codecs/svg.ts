import { decodeWithNative } from './native';

export async function decodeSvg(file: File | Blob): Promise<ImageData> {
  // Use browser native SVG renderer with high fidelity
  return await decodeWithNative(file);
}

