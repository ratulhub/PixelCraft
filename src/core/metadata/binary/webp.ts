import { SafeBinaryReader } from './reader';
import { RecursiveTiffParser, RawTiffTag } from './tiff';
import { RecursiveXmpParser, RawXmpEntry } from './xmp';

export interface WebpChunk {
  type: string;
  offset: number;
  length: number;
  data: Uint8Array;
}

export interface WebpScanResult {
  chunks: WebpChunk[];
  tiffTags: RawTiffTag[];
  xmpEntries: RawXmpEntry[];
  hasIccProfile: boolean;
  hasAnimation: boolean;
  hasAlpha: boolean;
  width?: number;
  height?: number;
}

export class WebpContainerScanner {
  public scan(buffer: ArrayBuffer): WebpScanResult {
    const reader = new SafeBinaryReader(buffer);
    const result: WebpScanResult = {
      chunks: [],
      tiffTags: [],
      xmpEntries: [],
      hasIccProfile: false,
      hasAnimation: false,
      hasAlpha: false,
    };

    // RIFF check
    if (reader.length < 12) return result;
    const riff = reader.readString(4);
    const fileSize = reader.readUint32(true); // Little endian
    const webp = reader.readString(4);

    if (riff !== 'RIFF' || webp !== 'WEBP') return result;

    while (reader.remaining >= 8) {
      const chunkOffset = reader.position;
      const chunkType = reader.readString(4);
      const chunkSize = reader.readUint32(true); // Little endian
      const paddedSize = chunkSize + (chunkSize % 2);

      if (chunkSize > reader.remaining) break;
      const data = reader.readBytes(chunkSize);
      if (chunkSize % 2 !== 0 && reader.remaining > 0) {
        reader.skip(1); // WebP chunks are 2-byte padded
      }

      result.chunks.push({
        type: chunkType,
        offset: chunkOffset,
        length: 8 + paddedSize,
        data,
      });

      // Parse chunk specifics
      if (chunkType === 'VP8X' && data.length >= 10) {
        const flags = data[0];
        result.hasIccProfile = (flags & 0x20) !== 0;
        result.hasAlpha = (flags & 0x10) !== 0;
        result.hasAnimation = (flags & 0x02) !== 0;

        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        result.width = 1 + (view.getUint8(4) | (view.getUint8(5) << 8) | (view.getUint8(6) << 16));
        result.height = 1 + (view.getUint8(7) | (view.getUint8(8) << 8) | (view.getUint8(9) << 16));
      } else if (chunkType === 'EXIF') {
        const exifReader = new SafeBinaryReader(data);
        // Sometimes EXIF chunk has "Exif\0\0" header, sometimes direct TIFF header
        let tiffStart = 0;
        if (data.length > 6 && data[0] === 0x45 && data[1] === 0x78 && data[2] === 0x69 && data[3] === 0x66) {
          tiffStart = 6;
        }
        const tiffParser = new RecursiveTiffParser(exifReader.createSubReader(tiffStart));
        result.tiffTags.push(...tiffParser.parse(0));
      } else if (chunkType === 'XMP ') {
        const xmpParser = new RecursiveXmpParser();
        result.xmpEntries.push(...xmpParser.parse(data, 'WebP:XMP'));
      } else if (chunkType === 'ANIM' || chunkType === 'ANMF') {
        result.hasAnimation = true;
      } else if (chunkType === 'ALPH') {
        result.hasAlpha = true;
      }
    }

    return result;
  }

  /**
   * Whitelist-based WebP reconstructor:
   * Strips EXIF and XMP chunks, recalculates VP8X flags and RIFF length.
   */
  public reconstructClean(
    buffer: ArrayBuffer,
    options: { preserveColorProfile: boolean }
  ): Blob {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    if (bytes.length < 12 || view.getUint32(0, false) !== 0x52494646 || view.getUint32(8, false) !== 0x57454250) {
      return new Blob([buffer], { type: 'image/webp' });
    }

    const retainedChunks: { type: string; data: Uint8Array }[] = [];
    let offset = 12;

    while (offset < bytes.length - 8) {
      const type = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      const len = view.getUint32(offset + 4, true);
      const paddedLen = len + (len % 2);
      const totalLen = 8 + paddedLen;

      if (offset + totalLen > bytes.length) break;

      let keep = false;
      if (type === 'VP8 ' || type === 'VP8L' || type === 'ALPH' || type === 'ANIM' || type === 'ANMF') {
        keep = true;
      } else if (type === 'ICCP' && options.preserveColorProfile) {
        keep = true;
      } else if (type === 'VP8X') {
        // We will modify VP8X flags below
        keep = true;
      }

      if (keep) {
        const chunkData = bytes.slice(offset, offset + totalLen);
        if (type === 'VP8X') {
          // Clear EXIF flag (bit 3 = 0x08) and XMP flag (bit 2 = 0x04)
          let flags = chunkData[8];
          flags &= ~0x08; // Clear EXIF
          flags &= ~0x04; // Clear XMP
          if (!options.preserveColorProfile) {
            flags &= ~0x20; // Clear ICCP
          }
          chunkData[8] = flags;
        }
        retainedChunks.push({ type, data: chunkData });
      }

      offset += totalLen;
    }

    // Compute total RIFF size
    let payloadSize = 4; // 'WEBP'
    for (const c of retainedChunks) {
      payloadSize += c.data.length;
    }

    const out = new Uint8Array(8 + payloadSize);
    const outView = new DataView(out.buffer);

    // 'RIFF'
    out.set([0x52, 0x49, 0x46, 0x46], 0);
    outView.setUint32(4, payloadSize, true);
    // 'WEBP'
    out.set([0x57, 0x45, 0x42, 0x50], 8);

    let writePos = 12;
    for (const c of retainedChunks) {
      out.set(c.data, writePos);
      writePos += c.data.length;
    }

    return new Blob([out], { type: 'image/webp' });
  }
}

