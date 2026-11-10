import { Sparkles, Shield, Archive, Zap } from 'lucide-react';
import { useStore, PresetMode } from '../../store';

interface PresetItem {
  id: PresetMode;
  label: string;
  icon: typeof Sparkles;
  desc: string;
}

const PRESETS: PresetItem[] = [
  {
    id: 'privacy-pure',
    label: 'Privacy Pure',
    icon: Shield,
    desc: 'Mode 1 Safe: Container-level strip of all EXIF, GPS, serials, XMP, IPTC & C2PA',
  },
  {
    id: 'disrupt',
    label: 'Disrupt Watermarks',
    icon: Zap,
    desc: 'Mode 2 Disrupt: Imperceptible pixel perturbation targeting SynthID / AI watermarks',
  },
  {
    id: 'web-balanced',
    label: 'Web Balanced',
    icon: Sparkles,
    desc: 'Convert to WebP 85% · Clears personal & GPS data · Keeps ICC color profile',
  },
  {
    id: 'archive-lossless',
    label: 'Archive Lossless',
    icon: Archive,
    desc: 'Mode 1 Safe: Retains bit-depth, preserves technical and color headers',
  },
];

export function PresetBar() {
  const preset = useStore((s) => s.preset);
  const applyPreset = useStore((s) => s.applyPreset);

  return (
    <div className="preset-bar">
      <div className="preset-bar__header">
        <span className="type-eyebrow">Processing Presets</span>
      </div>
      <div className="preset-bar__buttons">
        {PRESETS.map((p) => {
          const Icon = p.icon;
          const isActive = preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`preset-btn ${isActive ? 'preset-btn--active' : ''}`}
              title={p.desc}
            >
              <Icon size={14} strokeWidth={1.5} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
