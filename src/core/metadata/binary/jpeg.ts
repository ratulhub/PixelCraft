import { SafeBinaryReader } from './reader';
import { RecursiveTiffParser, RawTiffTag } from './tiff';
import { RecursiveXmpParser, RawXmpEntry } from './xmp';
import { IptcAndPhotoshopParser, RawIptcEntry, PhotoshopIrbBlock } from './iptc';

export interface JpegSegment {
  marker: number;
  markerName: string;
  offset: number;
  length: number;
  data: Uint8Array;
}

export interface JpegScanResult {
  segments: JpegSegment[];
  tiffTags: RawTiffTag[];
  xmpEntries: RawXmpEntry[];
  iptcEntries: RawIptcEntry[];
  irbBlocks: PhotoshopIrbBlock[];
  comments: string[];
  hasIccProfile: boolean;
  iccProfileBytes?: Uint8Array;
  hasC2paJumbf: boolean;
  hasTrailingBytes: boolean;
  trailingBytesLength: number;
  width?: number;
  height?: number;
  orientation?: number;
}

export const JPEG_MARKER_NAMES: Record<number, string> = {
  0xd8: 'SOI',
  0xd9: 'EOI',
  0xda: 'SOS',
  0xc0: 'SOF0 (Baseline)',
  0xc2: 'SOF2 (Progressive)',
  0xc4: 'DHT (Huffman)',
  0xdb: 'DQT (Quantization)',
  0xdd: 'DRI (Restart Interval)',
  0xe0: 'APP0 (JFIF)',
  0xe1: 'APP1 (EXIF/XMP)',
  0xe2: 'APP2 (ICC/MPF)',
  0xe3: 'APP3',
  0xe4: 'APP4',
  0xe5: 'APP5',
  0xe6: 'APP6',
  0xe7: 'APP7',
  0xe8: 'APP8',
  0xe9: 'APP9',
  0xea: 'APP10',
  0xeb: 'APP11 (JUMBF/C2PA)',
  0xec: 'APP12 (Picture Info)',
  0xed: 'APP13 (Photoshop/IPTC)',
  0xee: 'APP14 (Adobe)',
  0xef: 'APP15',
  0xfe: 'COM (Comment)',
};

export class JpegContainerScanner {
  public scan(buffer: ArrayBuffer): JpegScanResult {
    const reader = new SafeBinaryReader(buffer);
    const result: JpegScanResult = {
      segments: [],
      tiffTags: [],
      xmpEntries: [],
      iptcEntries: [],
      irbBlocks: [],
      comments: [],
      hasIccProfile: false,
      hasC2paJumbf: false,
      hasTrailingBytes: false,
      trailingBytesLength: 0,
    };

    if (reader.length < 4 || reader.readUint8() !== 0xff || reader.readUint8() !== 0xd8) {
      return result; // Not a valid JPEG (Missing SOI)
    }

    let eoiFoundOffset = -1;

    while (reader.remaining >= 2) {
      const b1 = reader.readUint8();
      if (b1 !== 0xff) continue;

      let marker = reader.readUint8();
      // Handle fill bytes (0xFF 0xFF ...)
      while (marker === 0xff && reader.remaining > 0) {
        marker = reader.readUint8();
      }

      // RST0-7, SOI, TEM have no length
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        continue;
      }

      if (marker === 0xd9) {
        // EOI (End of Image)
        eoiFoundOffset = reader.position;
        break;
      }

      if (marker === 0xda) {
        // SOS (Start of Scan) - scan image stream until EOI
        const sosLen = reader.readUint16(false);
        reader.skip(sosLen - 2);

        // Search for EOI (0xFF 0xD9) in the compressed bitstream
        while (reader.remaining >= 2) {
          if (reader.readUint8() === 0xff) {
            const next = reader.readUint8();
            if (next === 0xd9) {
              eoiFoundOffset = reader.position;
              break;
            }
          }
        }
        break;
      }

      if (reader.remaining < 2) break;
      const segOffset = reader.position - 2;
      const segLen = reader.readUint16(false); // Payload length includes the 2 length bytes
      if (segLen < 2 || segLen - 2 > reader.remaining) break;

      const payload = reader.readBytes(segLen - 2);
      const markerName = JPEG_MARKER_NAMES[marker] || `APP_0x${marker.toString(16)}`;

      result.segments.push({
        marker,
        markerName,
        offset: segOffset,
        length: segLen + 2,
        data: payload,
      });

      // Parse payload based on marker
      this.inspectSegmentPayload(marker, payload, result);
    }

    // Check for trailing data after EOI (steganography or hidden payload)
    if (eoiFoundOffset > 0 && eoiFoundOffset < buffer.byteLength) {
      result.hasTrailingBytes = true;
      result.trailingBytesLength = buffer.byteLength - eoiFoundOffset;
    }

    return result;
  }

  private inspectSegmentPayload(marker: number, payload: Uint8Array, result: JpegScanResult): void {
    const payloadReader = new SafeBinaryReader(payload);

    // APP1 (0xE1): EXIF or XMP
    if (marker === 0xe1) {
      const header = payloadReader.readString(6);
      if (header.startsWith('Exif\0\0')) {
        const tiffParser = new RecursiveTiffParser(payloadReader.createSubReader(6));
        const tags = tiffParser.parse(0);
        result.tiffTags.push(...tags);
        const orientTag = tags.find((t) => t.tagName === 'Orientation');
        if (orientTag && typeof orientTag.value === 'number') {
          result.orientation = orientTag.value;
        }
      } else if (payload.length > 29) {
        payloadReader.seek(0);
        const str = payloadReader.readString(29);
        if (str.startsWith('http://ns.adobe.com/xap/1.0/')) {
          const xmpParser = new RecursiveXmpParser();
          const xmpText = payload.slice(29);
          const entries = xmpParser.parse(xmpText, 'JPEG:APP1/XMP');
          result.xmpEntries.push(...entries);
        }
      }
    }

    // APP2 (0xE2): ICC Profile or MPF
    if (marker === 0xe2) {
      const header = payloadReader.readString(12);
      if (header.startsWith('ICC_PROFILE\0')) {
        result.hasIccProfile = true;
        result.iccProfileBytes = payload.slice(14); // Sequence number at 12, total chunks at 13
      }
    }

    // APP11 (0xEB): JUMBF / C2PA
    if (marker === 0xeb) {
      const header = payloadReader.readString(16);
      if (header.includes('JP') || header.includes('jumb') || header.includes('c2pa')) {
        result.hasC2paJumbf = true;
      }
    }

    // APP13 (0xED): Photoshop IRB / IPTC
    if (marker === 0xed) {
      const iptcParser = new IptcAndPhotoshopParser();
      iptcParser.parsePhotoshopIrb(payloadReader, 'JPEG:APP13/IRB');
      result.irbBlocks.push(...iptcParser.irbBlocks);
      result.iptcEntries.push(...iptcParser.iptcEntries);
    }

    // COM (0xFE): Comment
    if (marker === 0xfe) {
      const comment = new TextDecoder('utf-8', { fatal: false }).decode(payload).trim();
      if (comment) result.comments.push(comment);
    }

    // SOF0 / SOF2 (0xC0, 0xC2): Dimensions
    if (marker === 0xc0 || marker === 0xc2) {
      if (payload.length >= 5) {
        const height = (payload[1] << 8) | payload[2];
        const width = (payload[3] << 8) | payload[4];
        result.width = width;
        result.height = height;
      }
    }
  }

  /**
   * Whitelist-based container reconstruction:
   * Reconstructs a clean JPEG with byte-identical compressed image data,
   * retaining only essential headers and strictly requested color profiles.
   */
  public reconstructClean(
    buffer: ArrayBuffer,
    options: {
      preserveColorProfile: boolean;
      preserveProvenance: boolean;
      keepOrientationOnly?: boolean;
    }
  ): Blob {
    const bytes = new Uint8Array(buffer);
    const out: number[] = [0xff, 0xd8]; // SOI
    let i = 2;

    while (i < bytes.length - 1) {
      if (bytes[i] !== 0xff) {
        for (let j = i; j < bytes.length; j++) out.push(bytes[j]);
        break;
      }

      const marker = bytes[i + 1];

      // RST markers
      if (marker >= 0xd0 && marker <= 0xd7) {
        out.push(bytes[i], bytes[i + 1]);
        i += 2;
        continue;
      }

      if (marker === 0xd9) {
        // EOI - terminate clean (drops any trailing data)
        out.push(0xff, 0xd9);
        break;
      }

      // Stop at SOS (Start of Scan) - write remaining image bitstream and stop at EOI
      if (marker === 0xda) {
        for (let j = i; j < bytes.length; j++) {
          if (bytes[j] === 0xff && j + 1 < bytes.length && bytes[j + 1] === 0xd9) {
            out.push(0xff, 0xd9);
            break;
          }
          out.push(bytes[j]);
        }
        break;
      }

      if (i + 3 >= bytes.length) break;
      const length = (bytes[i + 2] << 8) | bytes[i + 3];
      const segmentTotalLen = 2 + length;

      // Whitelist evaluation:
      // Essential decoding segments: SOF (0xC0-0xCF except 0xC4/0xC8/0xCC), DHT (0xC4), DQT (0xDB), DRI (0xDD)
      const isEssentialFrameData =
        (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) ||
        marker === 0xc4 ||
        marker === 0xdb ||
        marker === 0xdd;

      // APP0 (JFIF): keep if standard
      const isApp0 = marker === 0xe0;

      // APP2 (ICC profile): keep only if preserveColorProfile is true
      let isPreservedIcc = false;
      if (marker === 0xe2 && options.preserveColorProfile) {
        const segData = bytes.slice(i + 4, i + 4 + 11);
        const str = String.fromCharCode(...segData);
        if (str.startsWith('ICC_PROFILE')) {
          isPreservedIcc = true;
        }
      }

      // APP11 (C2PA/JUMBF): keep only if preserveProvenance is true
      let isPreservedProvenance = false;
      if (marker === 0xeb && options.preserveProvenance) {
        isPreservedProvenance = true;
      }

      if (isEssentialFrameData || isApp0 || isPreservedIcc || isPreservedProvenance) {
        for (let j = i; j < i + segmentTotalLen; j++) {
          out.push(bytes[j]);
        }
      }

      i += segmentTotalLen;
    }

    return new Blob([new Uint8Array(out)], { type: 'image/jpeg' });
  }
}

