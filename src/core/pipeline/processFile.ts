import { FileEntry, ProcessingOptions, VerificationReport } from '../types';
import { getCodec } from '../codecs/registry';
import { decodeWithNative, imageDataToCanvas } from '../codecs/native';
import { decodeHeic } from '../codecs/heic';
import { decodeRaw, extractRawEmbeddedPreview } from '../codecs/raw';
import { SafeDeepSanitizer } from '../metadata/sanitizer';
import { IndependentVerificationEngine } from '../metadata/verifier';
import { applyPixelDisruption } from '../perturbation/disrupt';

export interface ProcessResult {
  blob: Blob;
  outputSize: number;
  processTimeMs: number;
  verificationReport: VerificationReport;
  processingMethod: string;
}

export async function decodeInput(
  file: File | Blob,
  rawMode?: 'preview' | 'full'
): Promise<ImageData> {
  const name = 'name' in file ? (file as File).name : '';
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'heic' || ext === 'heif') {
    return await decodeHeic(file);
  }

  if (['dng', 'cr2', 'cr3', 'nef', 'arw', 'raf', 'orf', 'rw2'].includes(ext)) {
    return await decodeRaw(file as File, { mode: rawMode ?? 'preview' });
  }

  return await decodeWithNative(file);
}

export async function processFile(
  entry: FileEntry,
  onProgress?: (progress: number) => void
): Promise<ProcessResult> {
  const startTime = performance.now();
  onProgress?.(10);

  const inputFormat = entry.format.toUpperCase();
  const outputFormat = entry.outputFormat.toUpperCase();
  const isSameFormat =
    inputFormat === outputFormat ||
    (inputFormat === 'JPEG' && outputFormat === 'JPG') ||
    (inputFormat === 'JPG' && outputFormat === 'JPEG');

  const options: ProcessingOptions = {
    mode: entry.mode || 'safe',
    outputFormat: entry.outputFormat,
    quality: entry.quality,
    lossless: entry.lossless,
    stripPersonalMetadata: entry.stripPersonalMetadata,
    stripGPS: entry.stripGPS,
    stripDeviceSoftware: entry.stripDeviceSoftware,
    stripCommentsDescriptions: entry.stripCommentsDescriptions,
    stripAIWorkflowParameters: entry.stripAIWorkflowParameters,
    stripC2PA: entry.stripC2PA,
    preserveColorProfile: entry.preserveColorProfile,
    preserveOrientation: entry.preserveOrientation,
    preserveTransparency: entry.preserveTransparency,
    preserveAnimation: entry.preserveAnimation,
    rawMode: entry.rawMode,
    disruptStrength: entry.disruptStrength,
  };

  const originalBuffer = await entry.file.arrayBuffer();
  let resultBlob: Blob;
  let processingMethod = '';

  // -------------------------------------------------------------
  // MODE 1: Safe (Metadata-Only Container Reconstruction)
  // -------------------------------------------------------------
  if (options.mode === 'safe' && isSameFormat) {
    onProgress?.(40);
    const sanitizer = new SafeDeepSanitizer();
    const cleanResult = await sanitizer.sanitizeContainer(originalBuffer, options);
    resultBlob = cleanResult.sanitizedBlob;
    processingMethod = cleanResult.method;
    onProgress?.(80);
  }

  // -------------------------------------------------------------
  // MODE 2: Disrupt (Pixel-Safe Watermark Perturbation)
  // -------------------------------------------------------------
  else if (options.mode === 'disrupt') {
    onProgress?.(30);
    let imageData: ImageData = await decodeInput(entry.file, entry.rawMode);
    onProgress?.(50);

    // Apply imperceptible frequency / spatial perturbation
    imageData = applyPixelDisruption(imageData, options.disruptStrength || 0.35);
    onProgress?.(70);

    const codec = await getCodec(outputFormat.toLowerCase());
    const encoded = await codec.encode(imageData, {
      quality: options.quality || 92,
      lossless: options.lossless,
    });

    resultBlob = encoded instanceof Blob ? encoded : new Blob([encoded as any], {
      type: `image/${outputFormat.toLowerCase() === 'jpg' ? 'jpeg' : outputFormat.toLowerCase()}`,
    });

    processingMethod = 'Mode 2: Quality-Gated Frequency & Pixel Perturbation (Watermark Disruption)';
    onProgress?.(85);
  }

  // -------------------------------------------------------------
  // MODE 3: High-Quality Format Conversion
  // -------------------------------------------------------------
  else {
    onProgress?.(30);
    let imageData: ImageData;
    try {
      imageData = await decodeInput(entry.file, entry.rawMode);
    } catch (err) {
      const preview = await extractRawEmbeddedPreview(entry.file);
      if (preview) {
        imageData = await decodeWithNative(preview);
      } else {
        throw err;
      }
    }
    onProgress?.(60);

    const codec = await getCodec(outputFormat.toLowerCase());
    const encoded = await codec.encode(imageData, {
      quality: options.quality,
      lossless: options.lossless,
    });

    resultBlob = encoded instanceof Blob ? encoded : new Blob([encoded as any], {
      type: `image/${outputFormat.toLowerCase() === 'jpg' ? 'jpeg' : outputFormat.toLowerCase()}`,
    });

    processingMethod = `Mode 3: High-Quality Codec Re-encoding (${outputFormat} @ ${options.quality}%)`;
    onProgress?.(85);
  }

  // -------------------------------------------------------------
  // INDEPENDENT VERIFICATION STAGE
  // -------------------------------------------------------------
  onProgress?.(90);
  const verifier = new IndependentVerificationEngine();
  const verificationReport = await verifier.verify(originalBuffer, resultBlob, options);

  onProgress?.(100);
  const endTime = performance.now();

  return {
    blob: resultBlob,
    outputSize: resultBlob.size,
    processTimeMs: Math.round(endTime - startTime),
    verificationReport,
    processingMethod,
  };
}
