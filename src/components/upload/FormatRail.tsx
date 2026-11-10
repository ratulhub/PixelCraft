import { Check, ShieldCheck, Zap, Camera, Sparkles } from 'lucide-react';

const CAPABILITIES = [
  {
    icon: Camera,
    title: 'Camera RAW & ProRAW',
    desc: 'Sony ARW, Canon CR2/CR3, Nikon NEF, Fuji RAF, Apple DNG with embedded preview extraction & full LibRaw demosaicing.',
  },
  {
    icon: ShieldCheck,
    title: 'Precision Metadata Stripping',
    desc: 'Container-level removal of GPS, serials, creator tags, and camera parameters without re-encoding or losing a single pixel.',
  },
  {
    icon: Zap,
    title: 'Next-Gen & Web Codecs',
    desc: 'WASM-accelerated AVIF, JPEG XL (JXL), WebP, PNG, and JPEG with multi-threaded browser pipelines.',
  },
  {
    icon: Sparkles,
    title: 'Batch & In-Memory ZIP',
    desc: 'Bulk process entire shoot batches with synchronous background queue and instant zip generation via fflate.',
  },
];

export function FormatRail() {
  return (
    <section className="format-rail">
      <div className="format-rail__header">
        <p className="type-eyebrow">Universal Ingestion & Conversion</p>
        <h2 className="type-editorial">Built for the modern photographic workflow</h2>
      </div>

      <div className="format-rail__grid">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          return (
            <div key={cap.title} className="rail-card">
              <div className="rail-card__icon">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <h3 className="rail-card__title">{cap.title}</h3>
              <p className="type-body rail-card__desc">{cap.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

