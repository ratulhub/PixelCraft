import { SafeDeepSanitizer } from './sanitizer';
import { MetadataEntry, ProcessingOptions } from '../types';

export async function stripMetadataOnly(
  file: File,
  entries: MetadataEntry[],
  options?: Partial<ProcessingOptions>
): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const sanitizer = new SafeDeepSanitizer();
  const defaultOptions: ProcessingOptions = {
    mode: 'safe',
    outputFormat: file.name.split('.').pop() || 'JPG',
    quality: 100,
    lossless: false,
    stripPersonalMetadata: true,
    stripGPS: true,
    stripDeviceSoftware: true,
    stripCommentsDescriptions: true,
    stripAIWorkflowParameters: true,
    stripC2PA: false,
    preserveColorProfile: true,
    preserveOrientation: true,
    preserveTransparency: true,
    preserveAnimation: true,
    ...options,
  };

  const res = await sanitizer.sanitizeContainer(buffer, defaultOptions);
  return res.sanitizedBlob;
}

export * from './sanitizer';
