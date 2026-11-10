export type MetadataCategory =
  | 'personal'
  | 'device'
  | 'location'
  | 'software'
  | 'editing'
  | 'descriptive'
  | 'technical'
  | 'color'
  | 'provenance'
  | 'unknown';

export type MetadataLayer = 'A' | 'B' | 'C';
export type MetadataAction = 'remove' | 'keep';
export type MetadataStatus = 'detected' | 'preserved' | 'removed' | 'unsupported' | 'verified';

export interface MetadataEntry {
  id: string;
  tag: string;
  name: string;
  value: string;
  location: string; // e.g. "JPEG:APP1/IFD0", "PNG:zTXt[parameters]"
  category: MetadataCategory;
  layer: MetadataLayer;
  action: MetadataAction;
  removable: boolean;
  impactsIntegrity: boolean;
  status?: MetadataStatus;
  rawType?: string | number;
}

export type ProcessingMode = 'safe' | 'disrupt' | 'convert';
export type ProcessingStatus = 'idle' | 'scanning' | 'processing' | 'done' | 'error';

export interface VerificationCheck {
  id: string;
  name: string;
  passed: boolean;
  details: string;
  category: 'privacy' | 'structure' | 'fidelity' | 'decodability';
}

export interface VerificationReport {
  status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'FAILED';
  checksPassed: number;
  checksTotal: number;
  checks: VerificationCheck[];
  timestamp: number;
  residualFieldsCount: number;
  originalSize: number;
  sanitizedSize: number;
}

export interface ProcessingOptions {
  mode: ProcessingMode;
  outputFormat: string;
  quality: number;
  lossless: boolean;
  stripPersonalMetadata: boolean;
  stripGPS: boolean;
  stripDeviceSoftware: boolean;
  stripCommentsDescriptions: boolean;
  stripAIWorkflowParameters: boolean;
  stripC2PA: boolean;
  preserveColorProfile: boolean;
  preserveOrientation: boolean;
  preserveTransparency: boolean;
  preserveAnimation: boolean;
  rawMode?: 'preview' | 'full';
  disruptStrength?: number; // 0.1 to 1.0
}

export interface FileEntry {
  id: string;
  file: File;
  name: string;
  size: number;
  format: string;
  width: number;
  height: number;
  orientation?: number;
  colorProfile?: string;
  previewUrl: string;
  status: ProcessingStatus;
  progress: number;
  errorMessage?: string;
  metadata: MetadataEntry[];
  verificationReport?: VerificationReport;

  // Processing settings
  mode: ProcessingMode;
  outputFormat: string;
  quality: number;
  lossless: boolean;
  stripPersonalMetadata: boolean;
  stripGPS: boolean;
  stripDeviceSoftware: boolean;
  stripCommentsDescriptions: boolean;
  stripAIWorkflowParameters: boolean;
  stripC2PA: boolean;
  preserveColorProfile: boolean;
  preserveOrientation: boolean;
  preserveTransparency: boolean;
  preserveAnimation: boolean;
  rawMode?: 'preview' | 'full';
  disruptStrength?: number;

  // Output results
  processedBlob?: Blob;
  outputSize?: number;
  processTimeMs?: number;
}

export interface CodecModule {
  decode?: (buffer: ArrayBuffer | Blob | ImageData) => Promise<ImageData>;
  encode: (imageData: ImageData, options?: Record<string, any>) => Promise<ArrayBuffer | Uint8Array | Blob>;
}

export interface FormatGroup {
  label: string;
  formats: string[];
}
