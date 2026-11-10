// Polyfill ImageData and Blob for Node CLI test environment
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(data, width, height) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}

if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = class Blob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options?.type || '';
      let size = 0;
      for (const p of parts) {
        if (p instanceof Uint8Array || p instanceof ArrayBuffer) size += p.byteLength || p.length;
        else if (typeof p === 'string') size += Buffer.byteLength(p);
      }
      this.size = size;
    }
    async arrayBuffer() {
      const bufs = this.parts.map((p) => (p instanceof Uint8Array ? Buffer.from(p) : Buffer.from(p)));
      const combined = Buffer.concat(bufs);
      return combined.buffer.slice(combined.byteOffset, combined.byteOffset + combined.byteLength);
    }
  };
}

// Test runner
import('./dist-test/engine.test.js').catch(async () => {
  console.log('Building TypeScript tests with esbuild...');
  const { execSync } = await import('child_process');
  execSync('npx esbuild src/core/tests/engine.test.ts --bundle --platform=node --format=esm --outfile=scripts/dist-test.mjs --external:libheif-js --external:rawconvert-wasm');
  const { runAllTests } = await import('./dist-test.mjs');
  console.log('Running Deep Metadata Engine Automated Test Suite...\n');
  const { passed, results } = await runAllTests();

  for (const r of results) {
    const symbol = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${symbol}: ${r.suiteName} (${r.durationMs}ms)`);
    for (const d of r.details) {
      console.log(`   └─ ${d}`);
    }
    console.log('');
  }

  console.log('==================================================');
  console.log(`OVERALL STATUS: ${passed ? 'ALL SUITES PASSED ✓' : 'SOME SUITES FAILED ✗'}`);
  console.log('==================================================');
  if (!passed) process.exit(1);
});

