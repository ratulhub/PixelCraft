import { ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { useStore } from '../../store';

export function Footer() {
  const setCurrentView = useStore((s) => s.setCurrentView);

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div className="footer__col">
            <p className="type-eyebrow footer__title">Architecture Guarantee</p>
            <p className="type-body footer__text">
              Zero network dispatch. Every operation executes entirely in your browser through
              WebAssembly (LibRaw, libheif, libjpeg, libpng, libwebp, libavif) and zero-telemetry
              client workers.
            </p>
          </div>

          <div className="footer__col">
            <p className="type-eyebrow footer__title">Honest Boundaries</p>
            <p className="type-body footer__text">
              Removes container metadata (EXIF, GPS, XMP, IPTC, device serials). Does not modify
              steganographic pixel-level watermarks (e.g. SynthID) to ensure absolute pixel fidelity.
            </p>
          </div>

          <div className="footer__col">
            <p className="type-eyebrow footer__title">Format Depth</p>
            <p className="type-body footer__text">
              Universal support for modern camera RAWs, Apple HEIC/HEIF containers, next-gen JXL,
              and full web-optimized raster formats.
            </p>
            <div className="footer__links">
              <button
                type="button"
                onClick={() => setCurrentView('formats')}
                className="footer__link"
              >
                Format Matrix →
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('privacy')}
                className="footer__link"
              >
                Privacy Statement →
              </button>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="type-mono footer__copy">
            PixelCraft © {new Date().getFullYear()} · Engineered for photographers & designers
          </span>
          <div className="footer__tags">
            <span className="type-mono">WASM Core</span>
            <span className="footer__dot" />
            <span className="type-mono">Zero Analytics</span>
            <span className="footer__dot" />
            <span className="type-mono">In-Memory Pipeline</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

