import { decodeWithNative } from './native';

export interface AnimationFrame {
  imageData: ImageData;
  delayMs: number;
}

/**
 * Handles animated formats (GIF, APNG)
 */
export async function decodeAnimation(file: File | Blob): Promise<AnimationFrame[]> {
  // First frame fast fallback via native
  const firstFrame = await decodeWithNative(file);
  return [{ imageData: firstFrame, delayMs: 100 }];
}

