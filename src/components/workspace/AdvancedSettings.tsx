import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { FileEntry } from '../../core/types';
import { useStore } from '../../store';
import { Switch } from '../ui/Switch';
import { SegmentedControl } from '../ui/SegmentedControl';

export function AdvancedSettings({ file }: { file: FileEntry }) {
  const [open, setOpen] = useState(false);
  const updateActiveFile = useStore((s) => s.updateActiveFile);

  const isRaw = ['DNG', 'CR2', 'CR3', 'NEF', 'ARW', 'RAF', 'ORF', 'RW2'].includes(file.format);

  return (
    <section className="panel">
      <button
        type="button"
        className="panel__header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="type-eyebrow">Advanced Granular Controls</span>
        <span className="panel__header-meta">
          <SlidersHorizontal size={14} strokeWidth={1.5} color="var(--text-muted)" />
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className={`panel__chevron ${open ? 'panel__chevron--open' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div className="panel__body advanced-settings-body">
          <div className="advanced-field">
            <Switch
              label="Strip GPS & Geographic Data"
              description="Remove latitude, longitude, altitude, and location name tags."
              checked={file.stripGPS}
              onChange={(checked) => updateActiveFile({ stripGPS: checked })}
            />
          </div>

          <div className="advanced-field">
            <Switch
              label="Strip Personal & Creator Identity"
              description="Remove Artist, Author, Copyright, By-line, and Owner fields."
              checked={file.stripPersonalMetadata}
              onChange={(checked) => updateActiveFile({ stripPersonalMetadata: checked })}
            />
          </div>

          <div className="advanced-field">
            <Switch
              label="Strip Device & Hardware Serial Numbers"
              description="Remove Camera Serial Number, Lens Serial, and internal hardware identifiers."
              checked={file.stripDeviceSoftware}
              onChange={(checked) => updateActiveFile({ stripDeviceSoftware: checked })}
            />
          </div>

          <div className="advanced-field">
            <Switch
              label="Strip AI Generation Traces (ComfyUI / Stable Diffusion)"
              description="Remove prompt text, negative prompt, seed, sampler settings, and ComfyUI node graphs."
              checked={file.stripAIWorkflowParameters}
              onChange={(checked) => updateActiveFile({ stripAIWorkflowParameters: checked })}
            />
          </div>

          <div className="advanced-field">
            <Switch
              label="Strip C2PA / Content Credentials Manifests"
              description="Remove JUMBF C2PA digital signatures and IPTC digitalSourceType markers."
              checked={file.stripC2PA}
              onChange={(checked) => updateActiveFile({ stripC2PA: checked })}
            />
          </div>

          <div className="advanced-field">
            <Switch
              label="Preserve ICC Color Profile"
              description="Keep original wide-gamut profile (e.g. Display P3 / Adobe RGB) rather than stripping to untagged sRGB."
              checked={file.preserveColorProfile}
              onChange={(checked) => updateActiveFile({ preserveColorProfile: checked })}
            />
          </div>

          <div className="advanced-field">
            <Switch
              label="Preserve Image Orientation"
              description="Normalize or retain rotation metadata to prevent photo flipping."
              checked={file.preserveOrientation}
              onChange={(checked) => updateActiveFile({ preserveOrientation: checked })}
            />
          </div>

          {isRaw && (
            <div className="field">
              <label className="field__label">RAW Development Pipeline</label>
              <SegmentedControl
                options={[
                  { value: 'preview', label: 'Embedded JPEG (Instant)' },
                  { value: 'full', label: 'Full LibRaw WASM (Demosaic)' },
                ]}
                value={file.rawMode ?? 'preview'}
                onChange={(val) => updateActiveFile({ rawMode: val as 'preview' | 'full' })}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
