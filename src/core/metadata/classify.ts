import { MetadataCategory, MetadataEntry, MetadataLayer, ProcessingOptions } from '../types';

export interface ClassificationRule {
  pattern: RegExp;
  category: MetadataCategory;
  name: string;
  removable: boolean;
  impactsIntegrity: boolean;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // 3. Location information
  { pattern: /^GPS/i, category: 'location', name: 'GPS Location', removable: true, impactsIntegrity: false },
  { pattern: /Location|Latitude|Longitude|Altitude|DestLatitude|DestLongitude|GPSMapDatum|City|Sublocation|ProvinceState|CountryName|CountryCode/i, category: 'location', name: 'Geographic Location', removable: true, impactsIntegrity: false },

  // 1. Personal information
  { pattern: /^Artist$|^Author$|^Creator$|^By-line$|^WriterEditor$/i, category: 'personal', name: 'Author / Creator', removable: true, impactsIntegrity: false },
  { pattern: /^Copyright|^Rights|^CopyrightNotice$/i, category: 'personal', name: 'Copyright & Rights', removable: true, impactsIntegrity: false },
  { pattern: /^OwnerName$|^CameraOwnerName$/i, category: 'personal', name: 'Camera Owner', removable: true, impactsIntegrity: false },
  { pattern: /^Contact$|^Credit$|^Source$/i, category: 'personal', name: 'Contact & Credit', removable: true, impactsIntegrity: false },
  { pattern: /^UserComment$/i, category: 'personal', name: 'User Comment', removable: true, impactsIntegrity: false },

  // 2. Device information
  { pattern: /^Make$|^LensMake$/i, category: 'device', name: 'Device Manufacturer', removable: true, impactsIntegrity: false },
  { pattern: /^Model$|^UniqueCameraModel$|^LocalizedCameraModel$/i, category: 'device', name: 'Device Model', removable: true, impactsIntegrity: false },
  { pattern: /^Lens$|^LensModel$|^LensInfo$/i, category: 'device', name: 'Lens Specification', removable: true, impactsIntegrity: false },
  { pattern: /SerialNumber|BodySerialNumber|LensSerialNumber|InternalSerialNumber/i, category: 'device', name: 'Hardware Serial Number', removable: true, impactsIntegrity: false },
  { pattern: /^CameraCalibration|^ProfileCalibration/i, category: 'device', name: 'Camera Sensor Calibration', removable: true, impactsIntegrity: false },

  // 4. Software information
  { pattern: /^Software$|^CreatorTool$|^OriginatingProgram$|^ProgramVersion$/i, category: 'software', name: 'Software / Editing Application', removable: true, impactsIntegrity: false },
  { pattern: /DALL·E|DALL-E|Midjourney|Stable Diffusion|ComfyUI|Photoshop|Firefly|Canva/i, category: 'software', name: 'Generator / Processing Application', removable: true, impactsIntegrity: false },

  // 5. Editing history
  { pattern: /DocumentID|InstanceID|OriginalDocumentID/i, category: 'editing', name: 'Document Tracking ID', removable: true, impactsIntegrity: false },
  { pattern: /History|DerivedFrom|VersionHistory|EditStatus|ModifyDate/i, category: 'editing', name: 'Revision / Edit History', removable: true, impactsIntegrity: false },

  // 6. Descriptive metadata
  { pattern: /^ImageDescription$|^Description$|^Caption$|^Headline$|^Title$|^ObjectName$/i, category: 'descriptive', name: 'Title & Description', removable: true, impactsIntegrity: false },
  { pattern: /^Keywords$|^Subject$|^Category$|^SupplementalCategories$/i, category: 'descriptive', name: 'Tags & Keywords', removable: true, impactsIntegrity: false },
  { pattern: /^Prompt$|^NegativePrompt$|^Parameters$|^Seed$/i, category: 'descriptive', name: 'Generation Prompt & Parameters', removable: true, impactsIntegrity: false },
  { pattern: /^DateTimeOriginal$|^CreateDate$|^DateCreated$|^TimeCreated$/i, category: 'descriptive', name: 'Original Creation Timestamp', removable: true, impactsIntegrity: false },

  // 8. Color profile information
  { pattern: /^ICC|^ColorSpace$|^ProfileDescription$|^MatrixCoefficients$|^PrimaryChromaticities$|^WhitePoint$/i, category: 'color', name: 'Color Space & ICC Profile', removable: true, impactsIntegrity: true },

  // 9. Provenance and authenticity information
  { pattern: /C2PA|JUMBF|DigitalSourceType|ContentCredentials|ClaimSignature|Manifest/i, category: 'provenance', name: 'Cryptographic Provenance Manifest', removable: true, impactsIntegrity: false },

  // 7. Technical image information
  { pattern: /^ImageWidth$|^ImageHeight$|^ImageLength$|^ExifImageWidth$|^ExifImageHeight$/i, category: 'technical', name: 'Dimensions', removable: false, impactsIntegrity: true },
  { pattern: /^BitsPerSample$|^BitDepth$|^Compression$|^PhotometricInterpretation$|^SamplesPerPixel$/i, category: 'technical', name: 'Pixel Format & Compression', removable: false, impactsIntegrity: true },
  { pattern: /^Orientation$/i, category: 'technical', name: 'Sensor Orientation', removable: true, impactsIntegrity: true },
  { pattern: /^XResolution$|^YResolution$|^ResolutionUnit$/i, category: 'technical', name: 'Print Resolution', removable: true, impactsIntegrity: false },
  { pattern: /^ExposureTime$|^FNumber$|^ISO$|^ShutterSpeedValue$|^ApertureValue$|^FocalLength$/i, category: 'technical', name: 'Camera Exposure Settings', removable: true, impactsIntegrity: false },
  { pattern: /^Flash$|^MeteringMode$|^WhiteBalance$|^ExposureMode$|^ExposureProgram$/i, category: 'technical', name: 'Shooting Conditions', removable: true, impactsIntegrity: false },

  // 10. Unknown or proprietary metadata
  { pattern: /^MakerNote/i, category: 'unknown', name: 'Camera Proprietary MakerNote', removable: true, impactsIntegrity: false },
];

export function classifyField(
  tag: string,
  value: string,
  location: string,
  layer: MetadataLayer,
  options?: Partial<ProcessingOptions>
): MetadataEntry {
  const cleanTag = tag.trim();
  let matchedRule: ClassificationRule | undefined;

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.pattern.test(cleanTag) || rule.pattern.test(location)) {
      matchedRule = rule;
      break;
    }
  }

  const category: MetadataCategory = matchedRule ? matchedRule.category : 'unknown';
  const name: string = matchedRule ? matchedRule.name : cleanTag;
  const removable: boolean = matchedRule ? matchedRule.removable : true;
  const impactsIntegrity: boolean = matchedRule ? matchedRule.impactsIntegrity : false;

  // Evaluate default action based on options
  let action: 'remove' | 'keep' = 'keep';

  if (!removable) {
    action = 'keep';
  } else if (category === 'personal' && (options?.stripPersonalMetadata ?? true)) {
    action = 'remove';
  } else if (category === 'location' && (options?.stripGPS ?? true)) {
    action = 'remove';
  } else if (category === 'device' && (options?.stripDeviceSoftware ?? true)) {
    action = 'remove';
  } else if (category === 'software' && (options?.stripDeviceSoftware ?? true)) {
    action = 'remove';
  } else if (category === 'editing' && (options?.stripPersonalMetadata ?? true)) {
    action = 'remove';
  } else if (category === 'descriptive' && (options?.stripCommentsDescriptions ?? true)) {
    action = 'remove';
  } else if (category === 'provenance') {
    action = options?.stripC2PA ? 'remove' : 'keep'; // Off by default to avoid destroying attribution
  } else if (category === 'color') {
    action = options?.preserveColorProfile ?? true ? 'keep' : 'remove';
  } else if (category === 'technical') {
    action = 'keep';
  } else if (category === 'unknown') {
    action = 'remove';
  }

  const id = `${location}-${cleanTag}-${Math.random().toString(36).substr(2, 6)}`;

  return {
    id,
    tag: cleanTag,
    name,
    value,
    location,
    category,
    layer,
    action,
    removable,
    impactsIntegrity,
    status: 'detected',
  };
}
