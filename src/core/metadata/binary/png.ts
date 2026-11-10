import { unzlibSync, inflateSync } from 'fflate';
import { SafeBinaryReader } from './reader';
import { RecursiveTiffParser, RawTiffTag } from './tiff';
import { RecursiveXmpParser, RawXmpEntry } from './xmp';

export interface PngChunk {
  type: string;
  offset: number;
  length: number;
  crc: number;
  data: Uint8Array;
}

export interface PngTextEntry {
  type: 'tEXt' | 'zTXt' | 'iTXt';
  keyword: string;
  text: string;
  compressed: boolean;
  language?: string;
  location: string;
}

export interface AiWorkflowMetadata {
  tool: 'ComfyUI' | 'Stable Diffusion (A1111/Forge)' | 'DALL-E' | 'Midjourney' | 'Unknown';
  prompt?: string;
  negativePrompt?: string;
  seed?: string;
  sampler?: string;
  steps?: number;
  cfgScale?: number;
  model?: string;
  workflowJson?: any;
}

export interface PngScanResult {
  chunks: PngChunk[];
  textEntries: PngTextEntry[];
  tiffTags: RawTiffTag[];
  xmpEntries: RawXmpEntry[];
  hasIccProfile: boolean;
  iccProfileName?: string;
  hasC2pa: boolean;
  hasTransparency: boolean;
  width?: number;
  height?: number;
  bitDepth?: number;
  colorType?: number;
  aiWorkflow?: AiWorkflowMetadata;
}

// CRC32 table
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function computeCrc32(typeBytes: Uint8Array, dataBytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < typeBytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ typeBytes[i]) & 0xff];
  }
  for (let i = 0; i < dataBytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ dataBytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export class PngContainerScanner {
  public scan(buffer: ArrayBuffer): PngScanResult {
    const reader = new SafeBinaryReader(buffer);
    const result: PngScanResult = {
      chunks: [],
      textEntries: [],
      tiffTags: [],
      xmpEntries: [],
      hasIccProfile: false,
      hasC2pa: false,
      hasTransparency: false,
    };

    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (reader.length < 8) return result;
    const sig = reader.readBytes(8);
    if (
      sig[0] !== 0x89 ||
      sig[1] !== 0x50 ||
      sig[2] !== 0x4e ||
      sig[3] !== 0x47 ||
      sig[4] !== 0x0d ||
      sig[5] !== 0x0a ||
      sig[6] !== 0x1a ||
      sig[7] !== 0x0a
    ) {
      return result; // Not a valid PNG
    }

    while (reader.remaining >= 12) {
      const chunkOffset = reader.position;
      const dataLen = reader.readUint32(false); // Big endian
      if (dataLen > reader.remaining) break;

      const typeBytes = reader.readBytes(4);
      const chunkType = String.fromCharCode(...typeBytes);

      const data = reader.readBytes(dataLen);
      const crc = reader.readUint32(false);

      result.chunks.push({
        type: chunkType,
        offset: chunkOffset,
        length: 12 + dataLen,
        crc,
        data,
      });

      this.inspectChunk(chunkType, data, result);

      if (chunkType === 'IEND') break;
    }

    // Deep Layer C AI workflow extraction
    this.extractAiWorkflows(result);

    return result;
  }

  private inspectChunk(type: string, data: Uint8Array, result: PngScanResult): void {
    // IHDR
    if (type === 'IHDR' && data.length >= 13) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      result.width = view.getUint32(0, false);
      result.height = view.getUint32(4, false);
      result.bitDepth = data[8];
      result.colorType = data[9];
      // Color type 4 (Grayscale + Alpha) or 6 (RGBA) or tRNS present
      if (result.colorType === 4 || result.colorType === 6) {
        result.hasTransparency = true;
      }
    }

    // tRNS (Transparency palette/alpha)
    if (type === 'tRNS') {
      result.hasTransparency = true;
    }

    // iCCP (ICC Color Profile)
    if (type === 'iCCP' && data.length > 2) {
      result.hasIccProfile = true;
      let nullIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1) {
        result.iccProfileName = new TextDecoder('latin1').decode(data.slice(0, nullIdx));
      }
    }

    // tEXt
    if (type === 'tEXt' && data.length > 1) {
      let nullIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1) {
        const keyword = new TextDecoder('latin1').decode(data.slice(0, nullIdx));
        const text = new TextDecoder('latin1').decode(data.slice(nullIdx + 1));
        result.textEntries.push({
          type: 'tEXt',
          keyword,
          text,
          compressed: false,
          location: `PNG:tEXt[${keyword}]`,
        });
      }
    }

    // zTXt (Compressed text via zlib deflate)
    if (type === 'zTXt' && data.length > 2) {
      let nullIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1 && nullIdx + 2 < data.length) {
        const keyword = new TextDecoder('latin1').decode(data.slice(0, nullIdx));
        const compressedData = data.slice(nullIdx + 2); // skip compression method byte (nullIdx + 1)
        try {
          let decompressed: Uint8Array;
          try {
            decompressed = unzlibSync(compressedData);
          } catch {
            decompressed = inflateSync(compressedData);
          }
          const text = new TextDecoder('latin1').decode(decompressed);
          result.textEntries.push({
            type: 'zTXt',
            keyword,
            text,
            compressed: true,
            location: `PNG:zTXt[${keyword}]`,
          });
        } catch {
          // Decompression warning
        }
      }
    }

    // iTXt (International UTF-8 Text)
    if (type === 'iTXt' && data.length > 5) {
      let nullIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIdx = i;
          break;
        }
      }
      if (nullIdx !== -1 && nullIdx + 4 < data.length) {
        const keyword = new TextDecoder('utf-8', { fatal: false }).decode(data.slice(0, nullIdx));
        const compressionFlag = data[nullIdx + 1];

        // Search for next nulls: lang tag null, trans keyword null
        let pos = nullIdx + 3;
        let langNull = -1;
        for (let i = pos; i < data.length; i++) {
          if (data[i] === 0) {
            langNull = i;
            break;
          }
        }
        let transNull = -1;
        if (langNull !== -1) {
          for (let i = langNull + 1; i < data.length; i++) {
            if (data[i] === 0) {
              transNull = i;
              break;
            }
          }
        }

        const textStart = transNull !== -1 ? transNull + 1 : pos;
        const textPayload = data.slice(textStart);

        try {
          let rawBytes: Uint8Array;
          if (compressionFlag === 1) {
            try {
              rawBytes = unzlibSync(textPayload);
            } catch {
              rawBytes = inflateSync(textPayload);
            }
          } else {
            rawBytes = textPayload;
          }
          const text = new TextDecoder('utf-8', { fatal: false }).decode(rawBytes);

          result.textEntries.push({
            type: 'iTXt',
            keyword,
            text,
            compressed: compressionFlag === 1,
            location: `PNG:iTXt[${keyword}]`,
          });

          // If keyword is XML:com.adobe.xmp, parse embedded XMP
          if (keyword === 'XML:com.adobe.xmp') {
            const xmpParser = new RecursiveXmpParser();
            result.xmpEntries.push(...xmpParser.parse(text, 'PNG:iTXt[XMP]'));
          }
        } catch {
          // Skip corrupt iTXt
        }
      }
    }

    // eXIf (Exif container chunk)
    if (type === 'eXIf' && data.length >= 8) {
      const tiffParser = new RecursiveTiffParser(new SafeBinaryReader(data));
      result.tiffTags.push(...tiffParser.parse(0));
    }

    // c2pa (Content Credentials chunk)
    if (type.toLowerCase() === 'c2pa' || type === 'jumb') {
      result.hasC2pa = true;
    }
  }

  private extractAiWorkflows(result: PngScanResult): void {
    for (const entry of result.textEntries) {
      // 1. Stable Diffusion (Automatic1111 / Forge)
      if (entry.keyword.toLowerCase() === 'parameters') {
        const lines = entry.text.split('\n');
        const prompt = lines[0]?.trim();
        let negativePrompt = '';
        let paramsLine = '';

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('Negative prompt:')) {
            negativePrompt = line.replace('Negative prompt:', '').trim();
          } else if (line.includes('Steps:') || line.includes('Sampler:') || line.includes('Seed:')) {
            paramsLine = line;
          }
        }

        const seedMatch = paramsLine.match(/Seed:\s*(\d+)/i);
        const stepsMatch = paramsLine.match(/Steps:\s*(\d+)/i);
        const samplerMatch = paramsLine.match(/Sampler:\s*([^,]+)/i);
        const cfgMatch = paramsLine.match(/CFG scale:\s*([\d.]+)/i);
        const modelMatch = paramsLine.match(/Model:\s*([^,]+)/i);

        result.aiWorkflow = {
          tool: 'Stable Diffusion (A1111/Forge)',
          prompt,
          negativePrompt,
          seed: seedMatch ? seedMatch[1] : undefined,
          steps: stepsMatch ? parseInt(stepsMatch[1], 10) : undefined,
          sampler: samplerMatch ? samplerMatch[1].trim() : undefined,
          cfgScale: cfgMatch ? parseFloat(cfgMatch[1]) : undefined,
          model: modelMatch ? modelMatch[1].trim() : undefined,
        };
        return;
      }

      // 2. ComfyUI (prompt and workflow chunks)
      if (entry.keyword === 'prompt' || entry.keyword === 'workflow') {
        try {
          const parsed = JSON.parse(entry.text);
          if (parsed && typeof parsed === 'object') {
            result.aiWorkflow = {
              tool: 'ComfyUI',
              workflowJson: parsed,
              prompt: `ComfyUI Graph (${Object.keys(parsed).length} nodes)`,
            };
            return;
          }
        } catch {
          // Not JSON
        }
      }

      // 3. DALL-E / OpenAI prompt chunks
      if (entry.keyword.toLowerCase().includes('prompt') || entry.text.includes('DALL·E')) {
        result.aiWorkflow = {
          tool: 'DALL-E',
          prompt: entry.text,
        };
        return;
      }
    }
  }

  /**
   * Whitelist-based PNG container reconstructor:
   * Reconstructs PNG with exact same IDAT image data, stripping all text, EXIF, C2PA, and private chunks.
   */
  public reconstructClean(
    buffer: ArrayBuffer,
    options: {
      preserveColorProfile: boolean;
      preserveProvenance: boolean;
    }
  ): Blob {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const chunks: Uint8Array[] = [];

    // PNG signature: 8 bytes
    chunks.push(bytes.slice(0, 8));

    let offset = 8;
    const WHITELIST = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'pHYs']);

    if (options.preserveColorProfile) {
      WHITELIST.add('iCCP');
      WHITELIST.add('sRGB');
      WHITELIST.add('gAMA');
      WHITELIST.add('cHRM');
    }

    if (options.preserveProvenance) {
      WHITELIST.add('c2pa');
      WHITELIST.add('jumb');
    }

    while (offset < bytes.length - 8) {
      const dataLen = view.getUint32(offset, false);
      const chunkTotalLen = 12 + dataLen;
      if (offset + chunkTotalLen > bytes.length) break;

      const type = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      if (WHITELIST.has(type)) {
        chunks.push(bytes.slice(offset, offset + chunkTotalLen));
      }

      offset += chunkTotalLen;
      if (type === 'IEND') break;
    }

    return new Blob(chunks as any, { type: 'image/png' });
  }
}
