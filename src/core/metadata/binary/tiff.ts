import { SafeBinaryReader } from './reader';

export interface RawTiffTag {
  tag: number;
  tagName: string;
  type: number;
  typeName: string;
  count: number;
  value: any;
  formattedValue: string;
  ifdPath: string; // e.g. "TIFF:IFD0", "TIFF:IFD0/ExifSubIFD", "TIFF:IFD0/GPSInfo"
}

export const TIFF_TAG_NAMES: Record<number, string> = {
  // IFD0 Baseline & Extended
  0x0100: 'ImageWidth',
  0x0101: 'ImageLength',
  0x0102: 'BitsPerSample',
  0x0103: 'Compression',
  0x0106: 'PhotometricInterpretation',
  0x010e: 'ImageDescription',
  0x010f: 'Make',
  0x0110: 'Model',
  0x0111: 'StripOffsets',
  0x0112: 'Orientation',
  0x0115: 'SamplesPerPixel',
  0x0116: 'RowsPerStrip',
  0x0117: 'StripByteCounts',
  0x011a: 'XResolution',
  0x011b: 'YResolution',
  0x011c: 'PlanarConfiguration',
  0x0128: 'ResolutionUnit',
  0x0131: 'Software',
  0x0132: 'ModifyDate',
  0x013b: 'Artist',
  0x013e: 'WhitePoint',
  0x013f: 'PrimaryChromaticities',
  0x0211: 'YCbCrCoefficients',
  0x0212: 'YCbCrSubSampling',
  0x0213: 'YCbCrPositioning',
  0x0214: 'ReferenceBlackWhite',
  0x8298: 'Copyright',
  0x8769: 'ExifOffset',
  0x8825: 'GPSInfoOffset',

  // Exif SubIFD
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8822: 'ExposureProgram',
  0x8827: 'ISO',
  0x9000: 'ExifVersion',
  0x9003: 'DateTimeOriginal',
  0x9004: 'CreateDate',
  0x9101: 'ComponentsConfiguration',
  0x9102: 'CompressedBitsPerPixel',
  0x9201: 'ShutterSpeedValue',
  0x9202: 'ApertureValue',
  0x9203: 'BrightnessValue',
  0x9204: 'ExposureCompensation',
  0x9205: 'MaxApertureValue',
  0x9206: 'SubjectDistance',
  0x9207: 'MeteringMode',
  0x9208: 'LightSource',
  0x9209: 'Flash',
  0x920a: 'FocalLength',
  0x927c: 'MakerNote',
  0x9286: 'UserComment',
  0x9290: 'SubSecTime',
  0x9291: 'SubSecTimeOriginal',
  0x9292: 'SubSecTimeDigitized',
  0xa000: 'FlashpixVersion',
  0xa001: 'ColorSpace',
  0xa002: 'ExifImageWidth',
  0xa003: 'ExifImageHeight',
  0xa004: 'RelatedSoundFile',
  0xa005: 'InteropOffset',
  0xa20e: 'FocalPlaneXResolution',
  0xa20f: 'FocalPlaneYResolution',
  0xa210: 'FocalPlaneResolutionUnit',
  0xa217: 'SensingMethod',
  0xa300: 'FileSource',
  0xa301: 'SceneType',
  0xa302: 'CFAPattern',
  0xa401: 'CustomRendered',
  0xa402: 'ExposureMode',
  0xa403: 'WhiteBalance',
  0xa404: 'DigitalZoomRatio',
  0xa405: 'FocalLengthIn35mmFormat',
  0xa406: 'SceneCaptureType',
  0xa407: 'GainControl',
  0xa408: 'Contrast',
  0xa409: 'Saturation',
  0xa40a: 'Sharpness',
  0xa40c: 'SubjectDistanceRange',
  0xa420: 'ImageUniqueID',
  0xa430: 'OwnerName',
  0xa431: 'SerialNumber',
  0xa432: 'LensInfo',
  0xa433: 'LensMake',
  0xa434: 'LensModel',
  0xa435: 'LensSerialNumber',

  // GPS IFD
  0x0000: 'GPSVersionID',
  0x0001: 'GPSLatitudeRef',
  0x0002: 'GPSLatitude',
  0x0003: 'GPSLongitudeRef',
  0x0004: 'GPSLongitude',
  0x0005: 'GPSAltitudeRef',
  0x0006: 'GPSAltitude',
  0x0007: 'GPSTimeStamp',
  0x0008: 'GPSSatellites',
  0x0009: 'GPSStatus',
  0x000a: 'GPSMeasureMode',
  0x000b: 'GPSDOP',
  0x000c: 'GPSSpeedRef',
  0x000d: 'GPSSpeed',
  0x000e: 'GPSTrackRef',
  0x000f: 'GPSTrack',
  0x0010: 'GPSImgDirectionRef',
  0x0011: 'GPSImgDirection',
  0x0012: 'GPSMapDatum',
  0x0013: 'GPSDestLatitudeRef',
  0x0014: 'GPSDestLatitude',
  0x0015: 'GPSDestLongitudeRef',
  0x0016: 'GPSDestLongitude',
  0x0017: 'GPSDestBearingRef',
  0x0018: 'GPSDestBearing',
  0x0019: 'GPSDestDistanceRef',
  0x001a: 'GPSDestDistance',
  0x001b: 'GPSProcessingMethod',
  0x001c: 'GPSAreaInformation',
  0x001d: 'GPSDateStamp',
  0x001e: 'GPSDifferential',

  // DNG & RAW Specific Tags
  0xc612: 'DNGVersion',
  0xc613: 'DNGBackwardVersion',
  0xc614: 'UniqueCameraModel',
  0xc615: 'LocalizedCameraModel',
  0xc621: 'ColorMatrix1',
  0xc622: 'ColorMatrix2',
  0xc628: 'DefaultCropOrigin',
  0xc629: 'DefaultCropSize',
  0xc634: 'OriginalRawFileName',
  0xc660: 'MakerNoteSafety',
  0xc68b: 'OriginalDefaultFinalSize',
  0xc6f3: 'CameraCalibrationSignature',
  0xc6f4: 'ProfileCalibrationSignature',
  0xc6f6: 'AsShotProfileName',
};

const TIFF_TYPE_NAMES: Record<number, string> = {
  1: 'BYTE',
  2: 'ASCII',
  3: 'SHORT',
  4: 'LONG',
  5: 'RATIONAL',
  6: 'SBYTE',
  7: 'UNDEFINED',
  8: 'SSHORT',
  9: 'SLONG',
  10: 'SRATIONAL',
  11: 'FLOAT',
  12: 'DOUBLE',
};

const TYPE_SIZES: Record<number, number> = {
  1: 1, 2: 1, 3: 2, 4: 4, 5: 8,
  6: 1, 7: 1, 8: 2, 9: 4, 10: 8,
  11: 4, 12: 8,
};

export class RecursiveTiffParser {
  private visitedOffsets = new Set<number>();
  private readonly maxDepth: number = 16;
  public tags: RawTiffTag[] = [];

  constructor(private reader: SafeBinaryReader) {}

  parse(baseTiffOffset: number = 0): RawTiffTag[] {
    this.tags = [];
    this.visitedOffsets.clear();

    if (!this.reader.seek(baseTiffOffset) || this.reader.remaining < 8) {
      return this.tags;
    }

    // Read byte order marker: 0x4949 ("II") = Little Endian, 0x4D4D ("MM") = Big Endian
    const byteOrder = this.reader.readUint16(false);
    if (byteOrder === 0x4949) {
      this.reader.isLittleEndian = true;
    } else if (byteOrder === 0x4d4d) {
      this.reader.isLittleEndian = false;
    } else {
      return this.tags; // Invalid TIFF header
    }

    const tiffMagic = this.reader.readUint16();
    if (tiffMagic !== 42 && tiffMagic !== 0x55 && tiffMagic !== 0x4f52) {
      return this.tags; // Not standard TIFF (42) or Olympus/Panasonic RAW
    }

    const firstIfdOffset = this.reader.readUint32();
    if (firstIfdOffset >= 8) {
      this.parseIfd(baseTiffOffset, baseTiffOffset + firstIfdOffset, 'TIFF:IFD0', 0);
    }

    return this.tags;
  }

  private parseIfd(baseOffset: number, ifdOffset: number, path: string, depth: number): void {
    if (depth >= this.maxDepth) return;
    if (this.visitedOffsets.has(ifdOffset)) return; // Prevent circular pointer loops
    this.visitedOffsets.add(ifdOffset);

    if (!this.reader.seek(ifdOffset) || this.reader.remaining < 2) return;

    const entryCount = this.reader.readUint16();
    if (entryCount === 0 || entryCount > 2048) return; // Malformed or empty IFD

    // Sub-IFD pointers queued for recursive descent
    const subIfdQueues: { path: string; offset: number }[] = [];

    for (let i = 0; i < entryCount; i++) {
      if (this.reader.remaining < 12) break;

      const tag = this.reader.readUint16();
      const type = this.reader.readUint16();
      const count = this.reader.readUint32();
      const valOrOffset = this.reader.readUint32();

      const typeSize = TYPE_SIZES[type] || 1;
      const totalSize = count * typeSize;
      const isInline = totalSize <= 4;
      const valueAbsoluteOffset = isInline ? this.reader.position - 4 : baseOffset + valOrOffset;

      const tagName = TIFF_TAG_NAMES[tag] || `Tag_0x${tag.toString(16).padStart(4, '0')}`;
      const typeName = TIFF_TYPE_NAMES[type] || `Type_${type}`;

      // Resolve tag value safely
      const value = this.readTagValue(valueAbsoluteOffset, type, count);
      const formattedValue = this.formatTagValue(tag, value);

      this.tags.push({
        tag,
        tagName,
        type,
        typeName,
        count,
        value,
        formattedValue,
        ifdPath: path,
      });

      // Queue nested Sub-IFD pointers
      if (tag === 0x8769 && typeof value === 'number') {
        subIfdQueues.push({ path: `${path}/ExifSubIFD`, offset: baseOffset + value });
      } else if (tag === 0x8825 && typeof value === 'number') {
        subIfdQueues.push({ path: `${path}/GPSInfo`, offset: baseOffset + value });
      } else if (tag === 0xa005 && typeof value === 'number') {
        subIfdQueues.push({ path: `${path}/Interop`, offset: baseOffset + value });
      } else if (tag === 0x014a) {
        // SubIFDs array (common in DNG and RAW)
        if (Array.isArray(value)) {
          value.forEach((off, idx) => {
            if (typeof off === 'number') {
              subIfdQueues.push({ path: `${path}/SubIFD[${idx}]`, offset: baseOffset + off });
            }
          });
        } else if (typeof value === 'number') {
          subIfdQueues.push({ path: `${path}/SubIFD[0]`, offset: baseOffset + value });
        }
      }
    }

    // Next IFD in chain (e.g. IFD1 for thumbnails)
    if (this.reader.canRead(4)) {
      const nextIfdOffset = this.reader.readUint32();
      if (nextIfdOffset > 0 && nextIfdOffset < this.reader.length) {
        const nextIndex = path.match(/IFD(\d+)/);
        const idx = nextIndex ? parseInt(nextIndex[1], 10) + 1 : 1;
        this.parseIfd(baseOffset, baseOffset + nextIfdOffset, `TIFF:IFD${idx}`, depth + 1);
      }
    }

    // Process all sub-IFDs recursively
    for (const sub of subIfdQueues) {
      this.parseIfd(baseOffset, sub.offset, sub.path, depth + 1);
    }
  }

  private readTagValue(offset: number, type: number, count: number): any {
    const savedPos = this.reader.position;
    if (!this.reader.seek(offset)) {
      this.reader.seek(savedPos);
      return null;
    }

    try {
      if (type === 2) {
        // ASCII string
        const str = this.reader.readString(count);
        return str.replace(/\0+$/, '').trim();
      }

      if (type === 1 || type === 6 || type === 7) {
        // BYTE / SBYTE / UNDEFINED
        if (count === 1) return this.reader.readUint8();
        const bytes = this.reader.readBytes(Math.min(count, 128));
        return bytes;
      }

      if (type === 3) {
        // SHORT (16-bit)
        if (count === 1) return this.reader.readUint16();
        const arr: number[] = [];
        for (let i = 0; i < Math.min(count, 32); i++) arr.push(this.reader.readUint16());
        return arr;
      }

      if (type === 4) {
        // LONG (32-bit)
        if (count === 1) return this.reader.readUint32();
        const arr: number[] = [];
        for (let i = 0; i < Math.min(count, 32); i++) arr.push(this.reader.readUint32());
        return arr;
      }

      if (type === 5 || type === 10) {
        // RATIONAL / SRATIONAL (num / den)
        const parseOne = () => {
          const num = type === 5 ? this.reader.readUint32() : this.reader.readInt32();
          const den = type === 5 ? this.reader.readUint32() : this.reader.readInt32();
          return den === 0 ? 0 : num / den;
        };
        if (count === 1) return parseOne();
        const arr: number[] = [];
        for (let i = 0; i < Math.min(count, 8); i++) arr.push(parseOne());
        return arr;
      }

      return null;
    } finally {
      this.reader.seek(savedPos);
    }
  }

  private formatTagValue(tag: number, val: any): string {
    if (val === null || val === undefined) return '';

    // GPS Latitude/Longitude formatting
    if ((tag === 0x0002 || tag === 0x0004) && Array.isArray(val) && val.length === 3) {
      const [deg, min, sec] = val;
      return `${deg}° ${min}' ${Number(sec).toFixed(2)}"`;
    }

    // Orientation human readable
    if (tag === 0x0112 && typeof val === 'number') {
      const MAP: Record<number, string> = {
        1: 'Horizontal (Normal)',
        2: 'Mirror horizontal',
        3: 'Rotate 180°',
        4: 'Mirror vertical',
        5: 'Mirror horizontal and rotate 270° CW',
        6: 'Rotate 90° CW',
        7: 'Mirror horizontal and rotate 90° CW',
        8: 'Rotate 270° CW',
      };
      return MAP[val] || String(val);
    }

    if (val instanceof Uint8Array) {
      if (tag === 0x927c) return `[MakerNote Binary Blob: ${val.length} bytes]`;
      if (tag === 0x9286) {
        // UserComment: check charset header (first 8 bytes: "ASCII\0\0\0" or "UNICODE\0")
        if (val.length > 8) {
          const text = new TextDecoder('utf-8', { fatal: false }).decode(val.slice(8));
          return text.replace(/\0+$/, '').trim() || `[${val.length} bytes binary comment]`;
        }
      }
      return `[Binary Data: ${val.length} bytes]`;
    }

    if (Array.isArray(val)) {
      return val.map((v) => (typeof v === 'number' ? Number(v.toFixed(4)) : v)).join(', ');
    }

    return String(val);
  }
}

