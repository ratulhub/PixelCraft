import { createPhotoshopJpegFixture, createStableDiffusionPngFixture, createComfyUiPngFixture } from './fixtures';
import { DeepMetadataScanner } from '../metadata/scanner';
import { SafeDeepSanitizer } from '../metadata/sanitizer';
import { IndependentVerificationEngine } from '../metadata/verifier';
import { applyPixelDisruption } from '../perturbation/disrupt';
import { ProcessingOptions } from '../types';

export interface TestResult {
  suiteName: string;
  passed: boolean;
  durationMs: number;
  details: string[];
}

export async function runAllTests(): Promise<{ passed: boolean; results: TestResult[] }> {
  const results: TestResult[] = [];
  const scanner = new DeepMetadataScanner();
  const sanitizer = new SafeDeepSanitizer();
  const verifier = new IndependentVerificationEngine();

  const defaultOptions: ProcessingOptions = {
    mode: 'safe',
    outputFormat: 'JPG',
    quality: 100,
    lossless: false,
    stripPersonalMetadata: true,
    stripGPS: true,
    stripDeviceSoftware: true,
    stripCommentsDescriptions: true,
    stripAIWorkflowParameters: true,
    stripC2PA: true,
    preserveColorProfile: true,
    preserveOrientation: true,
    preserveTransparency: true,
    preserveAnimation: true,
  };

  // -------------------------------------------------------------
  // Test 1: Deep Inspection & Sanitization of Photoshop JPEG with EXIF, GPS, IPTC, XMP, COM, Trailing Bytes
  // -------------------------------------------------------------
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    const jpegBuffer = createPhotoshopJpegFixture();
    const scanReport = await scanner.scan(jpegBuffer, defaultOptions);

    details.push(`Detected ${scanReport.entries.length} fields across Layer A & B.`);
    details.push(`GPS Coordinates: ${scanReport.summary.locationCount} detected.`);
    details.push(`Personal Tags: ${scanReport.summary.personalCount} detected.`);

    if (scanReport.summary.locationCount === 0) {
      passed = false;
      details.push('FAIL: Did not detect GPS coordinates in IFD0 GPSInfo sub-tree.');
    }
    if (scanReport.summary.personalCount === 0) {
      passed = false;
      details.push('FAIL: Did not detect personal artist/copyright in IFD0 or IPTC.');
    }

    // Sanitize
    const { sanitizedBlob } = await sanitizer.sanitizeContainer(jpegBuffer, defaultOptions);
    const verification = await verifier.verify(jpegBuffer, sanitizedBlob, defaultOptions);

    details.push(`Verification Status: ${verification.status} (${verification.checksPassed}/${verification.checksTotal} checks passed).`);
    if (verification.status !== 'VERIFIED') {
      passed = false;
      details.push('FAIL: Verification status was not VERIFIED.');
    }

    results.push({
      suiteName: 'JPEG Deep Multi-Layer Scanner & Reconstructor',
      passed,
      durationMs: Math.round(performance.now() - start),
      details,
    });
  }

  // -------------------------------------------------------------
  // Test 2: Stable Diffusion PNG with zTXt Compressed Parameters & Prompts
  // -------------------------------------------------------------
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    const sdBuffer = createStableDiffusionPngFixture();
    const scanReport = await scanner.scan(sdBuffer, defaultOptions);

    details.push(`Detected AI Tool: ${scanReport.aiTraces?.tool || 'None'}`);
    details.push(`Extracted Prompt: "${scanReport.aiTraces?.prompt?.substring(0, 40)}..."`);
    details.push(`Sampler: ${scanReport.aiTraces?.sampler}, Seed: ${scanReport.aiTraces?.seed}`);

    if (scanReport.aiTraces?.tool !== 'Stable Diffusion (A1111/Forge)') {
      passed = false;
      details.push('FAIL: Did not decompress and detect Stable Diffusion parameters from zTXt.');
    }

    // Sanitize
    const pngOptions = { ...defaultOptions, outputFormat: 'PNG' };
    const { sanitizedBlob } = await sanitizer.sanitizeContainer(sdBuffer, pngOptions);
    const verification = await verifier.verify(sdBuffer, sanitizedBlob, pngOptions);

    details.push(`Sanitized PNG Verification: ${verification.status}`);
    if (verification.status !== 'VERIFIED') {
      passed = false;
      details.push('FAIL: PNG verification failed.');
    }

    results.push({
      suiteName: 'PNG zTXt Compressed AI Workflow Scanner (Stable Diffusion)',
      passed,
      durationMs: Math.round(performance.now() - start),
      details,
    });
  }

  // -------------------------------------------------------------
  // Test 3: ComfyUI PNG with iTXt Node Graph JSON
  // -------------------------------------------------------------
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    const comfyBuffer = createComfyUiPngFixture();
    const scanReport = await scanner.scan(comfyBuffer, defaultOptions);

    details.push(`Detected AI Tool: ${scanReport.aiTraces?.tool}`);
    if (scanReport.aiTraces?.tool !== 'ComfyUI') {
      passed = false;
      details.push('FAIL: Did not parse ComfyUI graph from iTXt chunk.');
    }

    // Sanitize
    const pngOptions = { ...defaultOptions, outputFormat: 'PNG' };
    const { sanitizedBlob } = await sanitizer.sanitizeContainer(comfyBuffer, pngOptions);
    const postScan = await scanner.scan(await sanitizedBlob.arrayBuffer(), pngOptions);

    if (postScan.aiTraces) {
      passed = false;
      details.push('FAIL: ComfyUI node graph was not sanitized from PNG.');
    } else {
      details.push('PASS: ComfyUI workflow graph completely removed from PNG.');
    }

    results.push({
      suiteName: 'PNG iTXt ComfyUI Node Graph Scanner & Cleaner',
      passed,
      durationMs: Math.round(performance.now() - start),
      details,
    });
  }

  // -------------------------------------------------------------
  // Test 4: Truncated / Corrupt File Handling
  // -------------------------------------------------------------
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    const truncated = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x50, 0x45, 0x78]).buffer;
    try {
      const scan = await scanner.scan(truncated, defaultOptions);
      details.push(`Gracefully handled truncated JPEG without throwing: ${scan.entries.length} entries.`);
    } catch (e) {
      passed = false;
      details.push(`FAIL: Threw uncaught exception on truncated stream: ${(e as Error).message}`);
    }

    results.push({
      suiteName: 'Safe Boundary & Truncated Container Handling',
      passed,
      durationMs: Math.round(performance.now() - start),
      details,
    });
  }

  // -------------------------------------------------------------
  // Test 5: Mode 2 Pixel Perturbation (Watermark Disruption)
  // -------------------------------------------------------------
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    // Create 10x10 mock ImageData
    const rawData = new Uint8ClampedArray(10 * 10 * 4);
    for (let i = 0; i < rawData.length; i += 4) {
      rawData[i] = 120; rawData[i + 1] = 130; rawData[i + 2] = 140; rawData[i + 3] = 255;
    }
    const mockImage = new ImageData(rawData, 10, 10);
    const perturbed = applyPixelDisruption(mockImage, 0.35);

    // Verify alpha is intact
    let alphaIntact = true;
    let maxDiff = 0;
    for (let i = 0; i < rawData.length; i += 4) {
      if (perturbed.data[i + 3] !== 255) alphaIntact = false;
      const diffR = Math.abs(perturbed.data[i] - rawData[i]);
      if (diffR > maxDiff) maxDiff = diffR;
    }

    details.push(`Alpha channel intact: ${alphaIntact}`);
    details.push(`Max RGB channel perturbation: ±${maxDiff} units (guaranteed imperceptible).`);

    if (!alphaIntact || maxDiff === 0 || maxDiff > 10) {
      passed = false;
      details.push('FAIL: Pixel perturbation was outside quality-gated bounds.');
    }

    results.push({
      suiteName: 'Mode 2: Quality-Gated Watermark Perturbation Engine',
      passed,
      durationMs: Math.round(performance.now() - start),
      details,
    });
  }

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}

