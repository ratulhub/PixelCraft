import { SafeBinaryReader } from './reader';
import { RecursiveTiffParser, RawTiffTag } from './tiff';
import { RecursiveXmpParser, RawXmpEntry } from './xmp';

export interface IsoBmffBox {
  type: string;
  offset: number;
  length: number;
  headerSize: number;
}

export interface IsoBmffScanResult {
  boxes: IsoBmffBox[];
  majorBrand: string;
  compatibleBrands: string[];
  tiffTags: RawTiffTag[];
  xmpEntries: RawXmpEntry[];
  hasIccProfile: boolean;
  itemTypes: Map<number, string>;
  width?: number;
  height?: number;
  rotation?: number;
}

export class IsoBmffScanner {
  public scan(buffer: ArrayBuffer): IsoBmffScanResult {
    const reader = new SafeBinaryReader(buffer);
    const result: IsoBmffScanResult = {
      boxes: [],
      majorBrand: '',
      compatibleBrands: [],
      tiffTags: [],
      xmpEntries: [],
      hasIccProfile: false,
      itemTypes: new Map(),
    };

    this.scanBoxes(reader, 0, reader.length, '', 0, result);
    return result;
  }

  private scanBoxes(
    reader: SafeBinaryReader,
    startOffset: number,
    endOffset: number,
    pathPrefix: string,
    depth: number,
    result: IsoBmffScanResult
  ): void {
    if (depth > 12) return;
    reader.seek(startOffset);

    while (reader.position < endOffset && reader.remaining >= 8) {
      const boxOffset = reader.position;
      let boxSize = reader.readUint32(false); // Big endian
      const boxType = reader.readString(4);
      let headerSize = 8;

      if (boxSize === 1) {
        // Extended 64-bit size
        if (reader.remaining < 8) break;
        boxSize = Number(reader.readFloat64(false)); // or 64-bit int
        headerSize = 16;
      } else if (boxSize === 0) {
        // Box extends to end of file
        boxSize = endOffset - boxOffset;
      }

      if (boxSize < headerSize || boxOffset + boxSize > endOffset) {
        break; // Corrupted box size
      }

      const boxPath = pathPrefix ? `${pathPrefix}/${boxType}` : boxType;
      result.boxes.push({
        type: boxType,
        offset: boxOffset,
        length: boxSize,
        headerSize,
      });

      // ftyp
      if (boxType === 'ftyp' && boxSize >= 16) {
        result.majorBrand = reader.readString(4);
        reader.skip(4); // minor version
        const brandCount = (boxSize - 16) / 4;
        for (let b = 0; b < brandCount; b++) {
          result.compatibleBrands.push(reader.readString(4));
        }
      }

      // meta (FullBox)
      else if (boxType === 'meta') {
        // meta is a FullBox: skip 4 bytes (version + flags)
        reader.skip(4);
        const metaPayloadEnd = boxOffset + boxSize;
        this.scanBoxes(reader, reader.position, metaPayloadEnd, boxPath, depth + 1, result);
      }

      // Container boxes that hold children: iprp, ipco, moov, trak
      else if (['iprp', 'ipco', 'moov', 'trak', 'mdia', 'minf', 'dinf'].includes(boxType)) {
        this.scanBoxes(reader, reader.position, boxOffset + boxSize, boxPath, depth + 1, result);
      }

      // Item info entry (infe) inside iinf
      else if (boxType === 'infe') {
        reader.skip(4); // version + flags
        const itemId = reader.readUint16(false);
        reader.skip(2); // protection index
        const itemType = reader.readString(4);
        result.itemTypes.set(itemId, itemType);
      }

      // Item property: colr (color profile)
      else if (boxType === 'colr') {
        const colorType = reader.readString(4);
        if (colorType === 'prof' || colorType === 'rICC') {
          result.hasIccProfile = true;
        }
      }

      // Item property: ispe (image spatial extents - dimensions)
      else if (boxType === 'ispe') {
        reader.skip(4); // version + flags
        result.width = reader.readUint32(false);
        result.height = reader.readUint32(false);
      }

      // Item property: irot (rotation)
      else if (boxType === 'irot') {
        const rot = reader.readUint8() & 0x03;
        result.rotation = rot * 90;
      }

      // uuid box (often contains XMP)
      else if (boxType === 'uuid' && boxSize > 24) {
        const uuidBytes = reader.readBytes(16);
        // XMP UUID: be7c0cfb-9782-4245-8d1e-089a815a5f6e
        const isXmpUuid =
          uuidBytes[0] === 0xbe &&
          uuidBytes[1] === 0x7c &&
          uuidBytes[2] === 0x0c &&
          uuidBytes[3] === 0xfb;

        if (isXmpUuid) {
          const xmpParser = new RecursiveXmpParser();
          const xmpData = reader.readBytes(boxSize - headerSize - 16);
          result.xmpEntries.push(...xmpParser.parse(xmpData, `${boxPath}/XMP`));
        }
      }

      // Advance reader to next box
      reader.seek(boxOffset + boxSize);
    }
  }
}

