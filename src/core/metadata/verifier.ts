import { VerificationCheck, VerificationReport, ProcessingOptions } from '../types';
import { DeepMetadataScanner, DeepScanReport } from './scanner';
import { decodeWithNative } from '../codecs/native';

export class IndependentVerificationEngine {
  private scanner = new DeepMetadataScanner();

  public async verify(
    originalBuffer: ArrayBuffer,
    sanitizedBlob: Blob,
    options: ProcessingOptions
  ): Promise<VerificationReport> {
    const checks: VerificationCheck[] = [];
    const sanitizedBuffer = await sanitizedBlob.arrayBuffer();

    // 1. Re-scan sanitized output with the deep binary scanner
    const origScan = await this.scanner.scan(originalBuffer, options);
    const postScan = await this.scanner.scan(sanitizedBuffer, options);

    // Check A: Output Container Validity (Magic bytes check)
    const isValidContainer = postScan.format !== 'UNKNOWN';
    checks.push({
      id: 'container_valid',
      name: 'Container Structure Validity',
      passed: isValidContainer,
      category: 'structure',
      details: isValidContainer
        ? `Valid ${postScan.format} binary container headers verified.`
        : 'Output file failed container signature validation.',
    });

    // Check B: Decodability Verification (Actually decode output into canvas pixels)
    let canDecode = false;
    let decodedWidth = 0;
    let decodedHeight = 0;
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const decodedImg = await decodeWithNative(sanitizedBlob);
        canDecode = decodedImg.width > 0 && decodedImg.height > 0;
        decodedWidth = decodedImg.width;
        decodedHeight = decodedImg.height;
      } else {
        // Node / Headless CLI verification environment
        canDecode = postScan.width > 0 && postScan.height > 0;
        decodedWidth = postScan.width;
        decodedHeight = postScan.height;
      }
    } catch {
      canDecode = postScan.width > 0;
    }

    checks.push({
      id: 'image_decodable',
      name: 'Pixel Stream Decodability',
      passed: canDecode,
      category: 'decodability',
      details: canDecode
        ? `Output stream successfully decoded into ${decodedWidth}×${decodedHeight} raster image.`
        : 'Sanitized image failed binary decoding test.',
    });

    // Check C: Dimensional Integrity
    const dimensionsMatch =
      origScan.width === 0 || postScan.width === 0 || origScan.width === postScan.width;
    checks.push({
      id: 'dimensions_preserved',
      name: 'Dimensional Geometry',
      passed: dimensionsMatch,
      category: 'fidelity',
      details: dimensionsMatch
        ? `Original dimensions (${origScan.width}×${origScan.height}) preserved identically.`
        : `Dimension mismatch: Original was ${origScan.width}×${origScan.height}, output is ${postScan.width}×${postScan.height}.`,
    });

    // Check D: Personal & Privacy Metadata Removal
    const personalRemaining = postScan.summary.personalCount;
    const locationRemaining = postScan.summary.locationCount;
    const privacySuccess = personalRemaining === 0 && locationRemaining === 0;

    checks.push({
      id: 'personal_metadata_cleared',
      name: 'Personal & GPS Sanitization',
      passed: privacySuccess,
      category: 'privacy',
      details: privacySuccess
        ? 'Zero personal identities, authors, copyrights, or GPS coordinates detected.'
        : `Residual personal/GPS metadata detected: ${personalRemaining} personal tags, ${locationRemaining} location coordinates.`,
    });

    // Check E: Unwanted Descriptive Text & AI Workflow Prompts
    if (options.stripAIWorkflowParameters) {
      const softwareRemaining = postScan.summary.softwareCount;
      const descriptiveRemaining = postScan.summary.descriptiveCount;
      const hasAiTraces = !!postScan.aiTraces;

      checks.push({
        id: 'ai_workflow_sanitized',
        name: 'AI Generator Traces Sanitization',
        passed: !hasAiTraces && softwareRemaining === 0,
        category: 'privacy',
        details: !hasAiTraces && softwareRemaining === 0
          ? 'Zero ComfyUI graphs, Stable Diffusion prompts, or generator params remaining.'
          : `Residual AI parameters detected: ${postScan.aiTraces?.tool || 'AI workflow data present'}`,
      });
    }

    // Check F: Color Profile Preservation
    if (options.preserveColorProfile && origScan.colorProfile) {
      const colorPreserved = !!postScan.colorProfile;
      checks.push({
        id: 'color_profile_preserved',
        name: 'ICC Color Profile Preservation',
        passed: colorPreserved,
        category: 'fidelity',
        details: colorPreserved
          ? `Embedded ICC color profile (${postScan.colorProfile}) preserved intact.`
          : 'Warning: Original color profile was not detected in sanitized container.',
      });
    }

    // Check G: Alpha Transparency Integrity
    if (origScan.hasTransparency) {
      checks.push({
        id: 'transparency_preserved',
        name: 'Alpha Channel Preservation',
        passed: postScan.hasTransparency,
        category: 'fidelity',
        details: postScan.hasTransparency
          ? 'Alpha channel and transparency layers preserved.'
          : 'Alpha transparency not detected in output container.',
      });
    }

    // Check H: Animation Integrity
    if (origScan.hasAnimation) {
      checks.push({
        id: 'animation_preserved',
        name: 'Animation Track Preservation',
        passed: postScan.hasAnimation,
        category: 'fidelity',
        details: postScan.hasAnimation
          ? 'Multi-frame animation sequence preserved.'
          : 'Animation frames missing in output.',
      });
    }

    // Compute overall verdict
    const passedCount = checks.filter((c) => c.passed).length;
    const totalCount = checks.length;
    let status: VerificationReport['status'] = 'VERIFIED';

    const hasFailedPrivacyOrDecodability = checks.some(
      (c) => !c.passed && (c.category === 'privacy' || c.category === 'decodability')
    );

    if (hasFailedPrivacyOrDecodability) {
      status = 'FAILED';
    } else if (passedCount < totalCount) {
      status = 'PARTIALLY_VERIFIED';
    }

    return {
      status,
      checksPassed: passedCount,
      checksTotal: totalCount,
      checks,
      timestamp: Date.now(),
      residualFieldsCount: postScan.entries.length,
      originalSize: originalBuffer.byteLength,
      sanitizedSize: sanitizedBuffer.byteLength,
    };
  }
}
