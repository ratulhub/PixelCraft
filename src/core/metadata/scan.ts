import { MetadataEntry, ProcessingOptions } from '../types';
import { DeepMetadataScanner } from './scanner';

export async function scanMetadata(
  file: File | Blob | ArrayBuffer,
  options?: Partial<ProcessingOptions>
): Promise<MetadataEntry[]> {
  const scanner = new DeepMetadataScanner();
  const report = await scanner.scan(file, options);
  return report.entries;
}

export * from './scanner';
