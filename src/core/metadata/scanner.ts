import { MetadataEntry, ProcessingOptions } from '../types';
import { SafeBinaryReader } from './binary/reader';
import { JpegContainerScanner } from './binary/jpeg';
import { PngContainerScanner } from './binary/png';
import { WebpContainerScanner } from './binary/webp';
import { IsoBmffScanner } from './binary/isobmff';
import { RecursiveTiffParser } from './binary/tiff';
import { classifyField } from './classify';

export interface DeepScanReport {
  format: string;
  width: number;
  height: number;
  orientation?: number;
  colorProfile?: string;
  hasTransparency: boolean;
  hasAnimation: boolean;
  entries: MetadataEntry[];
  summary: {
    totalFields: number;
    personalCount: number;
    deviceCount: number;
    locationCount: number;
    softwareCount: number;
    editingCount: number;
    descriptiveCount: number;
    technicalCount: number;
    colorCount: number;
    provenanceCount: number;
    unknownCount: number;
  };
  aiTraces?: {
    tool: string;
    prompt?: string;
    negativePrompt?: string;
    seed?: string;
    sampler?: string;
    steps?: number;
    model?: string;
  };
}

export class DeepMetadataScanner {
  public async scan(fileOrBuffer: File | Blob | ArrayBuffer, options?: Partial<ProcessingOptions>): Promise<DeepScanReport> {
    let buffer: ArrayBuffer;
    if (fileOrBuffer instanceof ArrayBuffer) {
      buffer = fileOrBuffer;
    } else {
      buffer = await fileOrBuffer.arrayBuffer();
    }

    const reader = new SafeBinaryReader(buffer);
    const entries: MetadataEntry[] = [];
    let detectedFormat = 'UNKNOWN';
    let width = 0;
    let height = 0;
    let orientation: number | undefined;
    let colorProfile: string | undefined;
    let hasTransparency = false;
    let hasAnimation = false;
    let aiTraces: DeepScanReport['aiTraces'];

    // 1. Detect Container by Magic Bytes
    if (reader.length >= 4 && reader.peekUint8(0) === 0xff && reader.peekUint8(1) === 0xd8) {
      // JPEG
      detectedFormat = 'JPEG';
      const jpegScanner = new JpegContainerScanner();
      const res = jpegScanner.scan(buffer);
      width = res.width || 0;
      height = res.height || 0;
      orientation = res.orientation;
      if (res.hasIccProfile) colorProfile = 'Embedded ICC';

      // Layer A: TIFF tags from APP1
      for (const t of res.tiffTags) {
        entries.push(
          classifyField(t.tagName, t.formattedValue, `JPEG:APP1/${t.ifdPath}/${t.tagName}`, 'A', options)
        );
      }

      // Layer A: XMP entries from APP1
      for (const x of res.xmpEntries) {
        entries.push(
          classifyField(x.tag, x.value, x.location, 'A', options)
        );
      }

      // Layer A: IPTC entries from APP13
      for (const ip of res.iptcEntries) {
        entries.push(
          classifyField(ip.name, ip.value, ip.location, 'A', options)
        );
      }

      // Layer B: Segments
      for (const seg of res.segments) {
        if (seg.marker === 0xfe) {
          // COM
          entries.push(
            classifyField('Comment', new TextDecoder().decode(seg.data), `JPEG:COM[0x${seg.offset.toString(16)}]`, 'B', options)
          );
        } else if (seg.marker === 0xeb) {
          // JUMBF / C2PA
          entries.push(
            classifyField('C2PA JUMBF Manifest', 'Cryptographically signed provenance manifest', `JPEG:APP11[0x${seg.offset.toString(16)}]`, 'B', options)
          );
        }
      }

      // Layer B: Trailing data
      if (res.hasTrailingBytes) {
        entries.push(
          classifyField('Trailing Data (Post-EOI)', `${res.trailingBytesLength} unreferenced bytes appended after EOI marker`, 'JPEG:Trailer', 'B', options)
        );
      }
    } else if (reader.length >= 8 && reader.peekUint8(0) === 0x89 && reader.peekUint8(1) === 0x50) {
      // PNG
      detectedFormat = 'PNG';
      const pngScanner = new PngContainerScanner();
      const res = pngScanner.scan(buffer);
      width = res.width || 0;
      height = res.height || 0;
      hasTransparency = res.hasTransparency;
      if (res.hasIccProfile) colorProfile = res.iccProfileName || 'Embedded ICC';

      // Layer B & C: Text chunks
      for (const txt of res.textEntries) {
        const isAiPrompt = /prompt|workflow|parameters|negative/i.test(txt.keyword);
        entries.push(
          classifyField(
            txt.keyword,
            txt.text,
            txt.location,
            isAiPrompt ? 'C' : 'B',
            options
          )
        );
      }

      // Layer A: TIFF tags from eXIf
      for (const t of res.tiffTags) {
        entries.push(
          classifyField(t.tagName, t.formattedValue, `PNG:eXIf/${t.ifdPath}/${t.tagName}`, 'A', options)
        );
      }

      // Layer A: XMP
      for (const x of res.xmpEntries) {
        entries.push(classifyField(x.tag, x.value, x.location, 'A', options));
      }

      // Layer B: C2PA
      if (res.hasC2pa) {
        entries.push(
          classifyField('C2PA Chunk', 'Embedded Content Credentials chunk', 'PNG:c2pa', 'B', options)
        );
      }

      // AI Traces
      if (res.aiWorkflow) {
        aiTraces = {
          tool: res.aiWorkflow.tool,
          prompt: res.aiWorkflow.prompt,
          negativePrompt: res.aiWorkflow.negativePrompt,
          seed: res.aiWorkflow.seed,
          sampler: res.aiWorkflow.sampler,
          steps: res.aiWorkflow.steps,
          model: res.aiWorkflow.model,
        };
      }
    } else if (reader.length >= 12 && reader.peekUint32(0, false) === 0x52494646 && reader.peekUint32(8, false) === 0x57454250) {
      // WebP
      detectedFormat = 'WEBP';
      const webpScanner = new WebpContainerScanner();
      const res = webpScanner.scan(buffer);
      width = res.width || 0;
      height = res.height || 0;
      hasTransparency = res.hasAlpha;
      hasAnimation = res.hasAnimation;
      if (res.hasIccProfile) colorProfile = 'Embedded ICC';

      // Layer A: TIFF tags from EXIF chunk
      for (const t of res.tiffTags) {
        entries.push(
          classifyField(t.tagName, t.formattedValue, `WebP:EXIF/${t.ifdPath}/${t.tagName}`, 'A', options)
        );
      }

      // Layer A: XMP entries
      for (const x of res.xmpEntries) {
        entries.push(classifyField(x.tag, x.value, x.location, 'A', options));
      }
    } else if (
      reader.length >= 12 &&
      (reader.peekUint32(4, false) === 0x66747970 || reader.peekUint32(4, false) === 0x6d657461)
    ) {
      // ISO-BMFF: HEIC / HEIF / AVIF
      detectedFormat = 'HEIC/AVIF';
      const isobmff = new IsoBmffScanner();
      const res = isobmff.scan(buffer);
      width = res.width || 0;
      height = res.height || 0;
      orientation = res.rotation;
      if (res.hasIccProfile) colorProfile = 'Embedded ICC';
      detectedFormat = res.majorBrand.toUpperCase() || 'HEIC';

      // Layer A: TIFF tags
      for (const t of res.tiffTags) {
        entries.push(
          classifyField(t.tagName, t.formattedValue, `ISOBMFF:Exif/${t.ifdPath}/${t.tagName}`, 'A', options)
        );
      }

      // Layer A: XMP
      for (const x of res.xmpEntries) {
        entries.push(classifyField(x.tag, x.value, x.location, 'A', options));
      }
    } else if (
      (reader.length >= 4 && (reader.peekUint16(0, false) === 0x4949 || reader.peekUint16(0, false) === 0x4d4d))
    ) {
      // TIFF / Camera RAW (DNG, CR2, NEF, ARW, RAF, ORF, RW2)
      detectedFormat = 'RAW/TIFF';
      const tiffParser = new RecursiveTiffParser(reader);
      const tags = tiffParser.parse(0);

      for (const t of tags) {
        if (t.tagName === 'ImageWidth' && typeof t.value === 'number') width = t.value;
        if (t.tagName === 'ImageLength' && typeof t.value === 'number') height = t.value;
        if (t.tagName === 'Orientation' && typeof t.value === 'number') orientation = t.value;

        entries.push(
          classifyField(t.tagName, t.formattedValue, t.ifdPath + '/' + t.tagName, 'A', options)
        );
      }
    }

    // Compute Summary Counts
    const summary = {
      totalFields: entries.length,
      personalCount: entries.filter((e) => e.category === 'personal').length,
      deviceCount: entries.filter((e) => e.category === 'device').length,
      locationCount: entries.filter((e) => e.category === 'location').length,
      softwareCount: entries.filter((e) => e.category === 'software').length,
      editingCount: entries.filter((e) => e.category === 'editing').length,
      descriptiveCount: entries.filter((e) => e.category === 'descriptive').length,
      technicalCount: entries.filter((e) => e.category === 'technical').length,
      colorCount: entries.filter((e) => e.category === 'color').length,
      provenanceCount: entries.filter((e) => e.category === 'provenance').length,
      unknownCount: entries.filter((e) => e.category === 'unknown').length,
    };

    return {
      format: detectedFormat,
      width,
      height,
      orientation,
      colorProfile,
      hasTransparency,
      hasAnimation,
      entries,
      summary,
      aiTraces,
    };
  }
}

export async function scanDeepMetadata(
  fileOrBuffer: File | Blob | ArrayBuffer,
  options?: Partial<ProcessingOptions>
): Promise<DeepScanReport> {
  const scanner = new DeepMetadataScanner();
  return scanner.scan(fileOrBuffer, options);
}

