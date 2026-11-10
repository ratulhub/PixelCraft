import { ArrowLeft, Shield, Lock, EyeOff, AlertTriangle, Cpu } from 'lucide-react';
import { useStore } from '../store';

export function Privacy() {
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
          <p className="type-eyebrow">Privacy & Security Specification</p>
          <h1 className="type-editorial">Honest Privacy Architecture</h1>
          <p className="type-body" style={{ marginTop: 'var(--space-3)', maxWidth: 640 }}>
            PixelCraft is built on radical architectural honesty. Your images never leave your
            computer, and we make no unrealistic claims about invisible pixel tampering.
          </p>
        </header>

        <div className="privacy-grid">
          <div className="privacy-card">
            <div className="privacy-card__icon">
              <Lock size={18} strokeWidth={1.5} />
            </div>
            <h3 className="type-display" style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
              100% In-Memory Local Execution
            </h3>
            <p className="type-body">
              All processing happens strictly inside your browser tab via JavaScript and
              WebAssembly. No API calls are made, no telemetry is reported, and no cloud workers
              are ever contacted. When you close the tab, the memory is purged by your browser engine.
            </p>
          </div>

          <div className="privacy-card">
            <div className="privacy-card__icon">
              <Shield size={18} strokeWidth={1.5} />
            </div>
            <h3 className="type-display" style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
              What PixelCraft Does
            </h3>
            <p className="type-body">
              Removes identifiable container metadata: precise GPS latitude/longitude, camera body
              serial numbers, lens serials, capture timestamps, user comments, IPTC copyright fields,
              and thumbnail previews where personal location data is commonly cached.
            </p>
          </div>

          <div className="privacy-card">
            <div className="privacy-card__icon">
              <EyeOff size={18} strokeWidth={1.5} />
            </div>
            <h3 className="type-display" style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
              What PixelCraft Deliberately Avoids
            </h3>
            <p className="type-body">
              PixelCraft will not manipulate or blur pixel matrices to evade AI classifiers or remove
              invisible steganographic watermarks (such as Google SynthID or Digimarc). Evading those
              requires degrading optical quality, which contradicts our mission as a professional
              photographic utility.
            </p>
          </div>

          <div className="privacy-card">
            <div className="privacy-card__icon">
              <Cpu size={18} strokeWidth={1.5} />
            </div>
            <h3 className="type-display" style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>
              RAW & Apple ProRAW Policy
            </h3>
            <p className="type-body">
              Camera RAW files can be fully developed with LibRaw or extracted via embedded previews
              at native sensor resolution. ProRAW files with proprietary Apple JXL layers fall back
              gracefully to full-res embedded previews if the compressed bitstream is unparsed.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

