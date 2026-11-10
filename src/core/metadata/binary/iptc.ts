import { SafeBinaryReader } from './reader';

export interface RawIptcEntry {
  record: number;
  dataset: number;
  name: string;
  value: string;
  location: string;
}

export interface PhotoshopIrbBlock {
  resourceId: number;
  resourceName: string;
  data: Uint8Array;
  location: string;
}

export const IPTC_DATASET_NAMES: Record<number, string> = {
  0: 'ModelVersion',
  5: 'ObjectName', // Document Title
  7: 'EditStatus',
  10: 'Urgency',
  15: 'Category',
  20: 'SupplementalCategories',
  25: 'Keywords',
  40: 'SpecialInstructions',
  55: 'DateCreated',
  60: 'TimeCreated',
  62: 'DigitalCreationDate',
  63: 'DigitalCreationTime',
  65: 'OriginatingProgram',
  70: 'ProgramVersion',
  80: 'By-line', // Author
  85: 'By-lineTitle',
  90: 'City',
  92: 'Sublocation',
  95: 'ProvinceState',
  100: 'CountryCode',
  101: 'CountryName',
  103: 'OriginalTransmissionReference',
  105: 'Headline',
  110: 'Credit',
  115: 'Source',
  116: 'CopyrightNotice',
  118: 'Contact',
  120: 'CaptionAbstract',
  122: 'WriterEditor',
  135: 'DigitalSourceType', // Modern AI provenance tag in IPTC!
};

export class IptcAndPhotoshopParser {
  public irbBlocks: PhotoshopIrbBlock[] = [];
  public iptcEntries: RawIptcEntry[] = [];

  /**
   * Parses Photoshop 8BIM Image Resource Blocks (e.g. from JPEG APP13 or TIFF tag 0x8649)
   */
  parsePhotoshopIrb(reader: SafeBinaryReader, locationPrefix = 'JPEG:APP13/IRB'): void {
    this.irbBlocks = [];
    this.iptcEntries = [];

    // Optional Photoshop 3.0 header: "Photoshop 3.0\0"
    const headerStr = reader.readString(14);
    if (headerStr.startsWith('Photoshop 3.0')) {
      // Seek past header
    } else {
      reader.seek(0);
    }

    while (reader.remaining >= 12) {
      // Signature must be "8BIM" (0x38, 0x42, 0x49, 0x4D) or "MeSa"
      const sig = reader.readString(4);
      if (sig !== '8BIM' && sig !== 'MeSa') {
        break;
      }

      const resourceId = reader.readUint16(false); // Big Endian

      // Pascal string name (first byte is length, followed by characters, padded to even count)
      const nameLen = reader.readUint8();
      let name = '';
      if (nameLen > 0) {
        name = reader.readString(nameLen);
      }
      // Padded to even length
      if ((nameLen + 1) % 2 !== 0 && reader.remaining > 0) {
        reader.skip(1);
      }

      const dataSize = reader.readUint32(false); // Big Endian
      if (dataSize > reader.remaining) break;

      const data = reader.readBytes(dataSize);
      // Data is padded to even bytes
      if (dataSize % 2 !== 0 && reader.remaining > 0) {
        reader.skip(1);
      }

      const blockLocation = `${locationPrefix}[0x${resourceId.toString(16).padStart(4, '0')}]`;
      this.irbBlocks.push({
        resourceId,
        resourceName: name,
        data,
        location: blockLocation,
      });

      // If resourceId is 0x0404, it's an IPTC-NAA record stream!
      if (resourceId === 0x0404) {
        this.parseIptcIimStream(new SafeBinaryReader(data), `${blockLocation}/IPTC`);
      }
    }
  }

  /**
   * Parses raw IPTC IIM dataset stream (tag marker 0x1C)
   */
  parseIptcIimStream(reader: SafeBinaryReader, locationPrefix = 'IPTC'): RawIptcEntry[] {
    const entries: RawIptcEntry[] = [];

    while (reader.remaining >= 5) {
      const tagMarker = reader.readUint8();
      if (tagMarker !== 0x1c) {
        // IPTC tags always start with 0x1C
        break;
      }

      const recordNum = reader.readUint8();
      const datasetNum = reader.readUint8();
      let dataLen = reader.readUint16(false); // Big endian length

      // Check for extended dataset tag (0x8000 flag)
      if ((dataLen & 0x8000) !== 0) {
        const countBytes = dataLen & 0x7fff;
        if (countBytes === 4 && reader.canRead(4)) {
          dataLen = reader.readUint32(false);
        }
      }

      if (dataLen > reader.remaining) break;
      const valBytes = reader.readBytes(dataLen);
      const textVal = new TextDecoder('utf-8', { fatal: false }).decode(valBytes).trim();

      const name =
        recordNum === 2
          ? IPTC_DATASET_NAMES[datasetNum] || `Record2:Tag_${datasetNum}`
          : `Record${recordNum}:Tag_${datasetNum}`;

      const entry: RawIptcEntry = {
        record: recordNum,
        dataset: datasetNum,
        name,
        value: textVal,
        location: `${locationPrefix}/2:${datasetNum}[${name}]`,
      };

      entries.push(entry);
      this.iptcEntries.push(entry);
    }

    return entries;
  }
}

