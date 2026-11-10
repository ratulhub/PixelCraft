import { Badge } from '../components/ui/Badge';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../store';

const FORMAT_MATRIX = [
  {
    format: 'JPEG / JPG',
    category: 'Web Standard',
    decode: 'Native / @jsquash/jpeg',
    encode: '@jsquash/jpeg WASM',
    metadata: 'APP1/APP13/COM Segment Strip (No re-encode)',
    notes: 'Lossy, universal compatibility, quality 1–100%',
  },
  {
    format: 'PNG / APNG',
    category: 'Web Standard',
    decode: 'Native / @jsquash/png',
    encode: '@jsquash/png WASM',
    metadata: 'tEXt, iTXt, zTXt, eXIf chunk strip',
    notes: 'Lossless with full alpha transparency',
  },
  {
    format: 'WebP',
    category: 'Modern Web',
    decode: 'Native / @jsquash/webp',
    encode: '@jsquash/webp WASM',
    metadata: 'RIFF EXIF/XMP box strip',
    notes: '30% smaller than JPEG at equal visual fidelity',
  },
  {
    format: 'AVIF',
    category: 'Next-Gen Web',
    decode: 'Native / @jsquash/avif',
    encode: '@jsquash/avif WASM',
    metadata: 'Container item & meta strip',
    notes: 'High efficiency AV1 intra-frame compression',
  },
  {
    format: 'JPEG XL (JXL)',
    category: 'Next-Gen Editorial',
    decode: '@jsquash/jxl WASM',
    encode: '@jsquash/jxl WASM',
    metadata: 'Box-level stripping',
    notes: 'Superior fidelity, wide gamut, HDR preservation',
  },
  {
    format: 'HEIC / HEIF',
    category: 'Apple Mobile',
    decode: 'libheif-js WASM',
    encode: 'Output to JPG / WebP / AVIF',
    metadata: 'ExifTool & ISOBMFF parser',
    notes: 'Full Apple Live Photo & Portrait decode',
  },
  {
    format: 'Camera RAW (DNG, CR2, NEF, ARW, RAF)',
    category: 'Professional Capture',
    decode: 'rawconvert-wasm / Embedded Preview',
    encode: 'Convert to any raster format',
    metadata: 'Full EXIF extraction & sanitization',
    notes: 'Direct 14-bit demosaicing or instant preview',
  },
  {
    format: 'SVG',
    category: 'Vector Graphics',
    decode: 'Native DOM / Canvas',
    encode: 'High-res rasterization to PNG / WebP',
    metadata: 'XML comment & metadata removal',
    notes: 'Arbitrary resolution scaling',
  },
];

export function Formats() {
  const setCurrentView = useStore((s) => s.setCurrentView);
  const files = useStore((s) => s.files);

  return (
    <main className="info-page">
      <div className="info-page__inner">
        <button
          type="button"
          onClick={() => setCurrentView(files.length > 0 ? 'workspace' : 'home')}
          className="batch__back-btn"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to Workspace
        </button>

        <header className="info-page__header">
          <p className="type-eyebrow">Technical Architecture</p>
          <h1 className="type-editorial">Supported Formats & Codec Engines</h1>
          <p className="type-body" style={{ marginTop: 'var(--space-3)', maxWidth: 640 }}>
            PixelCraft pairs browser-native decoders with isolated WebAssembly modules compiled
            from industry-standard C/C++ libraries (LibRaw, libheif, libjpeg, libpng, libwebp).
          </p>
        </header>

        <div className="format-table-wrap">
          <table className="format-table">
            <thead>
              <tr>
                <th>Format</th>
                <th>Category</th>
                <th>Decoding Engine</th>
                <th>Encoding Engine</th>
                <th>Metadata Policy</th>
                <th>Characteristics</th>
              </tr>
            </thead>
            <tbody>
              {FORMAT_MATRIX.map((row) => (
                <tr key={row.format}>
                  <td>
                    <Badge variant="mono">{row.format}</Badge>
                  </td>
                  <td>{row.category}</td>
                  <td className="type-mono">{row.decode}</td>
                  <td className="type-mono">{row.encode}</td>
                  <td className="type-body">{row.metadata}</td>
                  <td className="type-body">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

