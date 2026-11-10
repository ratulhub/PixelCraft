import { ProcessingOptions } from '../types';
import { JpegContainerScanner } from './binary/jpeg';
import { PngContainerScanner } from './binary/png';
import { WebpContainerScanner } from './binary/webp';
import { SafeBinaryReader } from './binary/reader';

export class SafeDeepSanitizer {
  /**
   * Sanitizes binary container by reconstructing it from scratch using whitelist-based chunk/segment filter.
   * Mode 1: Metadata-Only, zero pixel re-encoding.
   */
  public async sanitizeContainer(
    buffer: ArrayBuffer,
    options: ProcessingOptions
  ): Promise<{ sanitizedBlob: Blob; method: string }> {
    const reader = new SafeBinaryReader(buffer);

    // 1. JPEG Whitelist Reconstructor
    if (reader.length >= 4 && reader.peekUint8(0) === 0xff && reader.peekUint8(1) === 0xd8) {
      const jpegScanner = new JpegContainerScanner();
      const sanitizedBlob = jpegScanner.reconstructClean(buffer, {
        preserveColorProfile: options.preserveColorProfile,
        preserveProvenance: !options.stripC2PA,
        keepOrientationOnly: options.preserveOrientation,
      });

      return {
        sanitizedBlob,
        method: 'JPEG Container Whitelist Reconstruction (Zero Generational Loss)',
      };
    }

    // 2. PNG Whitelist Reconstructor
    if (reader.length >= 8 && reader.peekUint8(0) === 0x89 && reader.peekUint8(1) === 0x50) {
      const pngScanner = new PngContainerScanner();
      const sanitizedBlob = pngScanner.reconstructClean(buffer, {
        preserveColorProfile: options.preserveColorProfile,
        preserveProvenance: !options.stripC2PA,
      });

      return {
        sanitizedBlob,
        method: 'PNG Whitelist Chunk Stream Reconstruction (Pixel Scanlines Preserved)',
      };
    }

    // 3. WebP Whitelist Reconstructor
    if (reader.length >= 12 && reader.peekUint32(0, false) === 0x52494646 && reader.peekUint32(8, false) === 0x57454250) {
      const webpScanner = new WebpContainerScanner();
      const sanitizedBlob = webpScanner.reconstructClean(buffer, {
        preserveColorProfile: options.preserveColorProfile,
      });

      return {
        sanitizedBlob,
        method: 'WebP RIFF Container Re-framing (VP8/VP8L Intact, EXIF/XMP Stripped)',
      };
    }

    // 4. Default: Return original container if format is unknown or doesn't support container-level strip
    return {
      sanitizedBlob: new Blob([buffer]),
      method: 'Pass-through Container',
    };
  }
}

