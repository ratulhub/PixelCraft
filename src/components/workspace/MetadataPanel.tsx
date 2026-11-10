import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  Info,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  MapPin,
  Lock,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { SegmentedControl } from '../ui/SegmentedControl';
import { FileEntry, MetadataEntry, ProcessingMode } from '../../core/types';
import { useStore } from '../../store';

export function MetadataPanel({ file }: { file: FileEntry }) {
  const [open, setOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [activeTab, setActiveTab] = useState<'inspection' | 'verification'>('inspection');
  const updateActiveFile = useStore((s) => s.updateActiveFile);

  const mode = file.mode || 'safe';

  const handleModeChange = (newMode: ProcessingMode) => {
    updateActiveFile({ mode: newMode });
  };

  const toggleAction = (tagId: string) => {
    const updated = file.metadata.map((m) => {
      if (m.id === tagId) {
        return {
          ...m,
          action: (m.action === 'remove' ? 'keep' : 'remove') as 'remove' | 'keep',
          status: (m.action === 'remove' ? 'preserved' : 'removed') as any,
        };
      }
      return m;
    });
    updateActiveFile({ metadata: updated });
  };

  // Filtered metadata
  const filtered = file.metadata.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLayer = selectedLayer === 'all' || m.layer === selectedLayer;
    return matchesSearch && matchesLayer;
  });

  const removable = file.metadata.filter((m) => m.action === 'remove');
  const kept = file.metadata.filter((m) => m.action === 'keep');
  const personal = file.metadata.filter((m) => m.category === 'personal');
  const location = file.metadata.filter((m) => m.category === 'location');
  const device = file.metadata.filter((m) => m.category === 'device');
  const software = file.metadata.filter((m) => m.category === 'software');
  const provenance = file.metadata.filter((m) => m.category === 'provenance');

  const verification = file.verificationReport;

  return (
    <section className="panel forensic-panel">
      {/* Panel Header */}
      <div className="panel__header" onClick={() => setOpen(!open)}>
        <div className="forensic-panel__title-row">
          <span className="type-eyebrow">Deep Metadata & Privacy Engine</span>
          <span className="type-mono forensic-badge-count">
            {file.metadata.length} fields detected
          </span>
        </div>
        <span className="panel__header-meta">
          {verification ? (
            <Badge variant={verification.status === 'VERIFIED' ? 'success' : 'danger'}>
              {verification.status}
            </Badge>
          ) : (
            <>
              <Badge variant="danger">{removable.length} removable</Badge>
              <Badge variant="success">{kept.length} kept</Badge>
            </>
          )}
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className={`panel__chevron ${open ? 'panel__chevron--open' : ''}`}
          />
        </span>
      </div>

      {open && (
        <div className="panel__body forensic-body">
          {/* Mode Selector */}
          <div className="mode-selection-box">
            <div className="field__label-row" style={{ marginBottom: 6 }}>
              <label className="field__label">Sanitization & Watermark Mode</label>
              <span className="type-mono" style={{ color: 'var(--accent-primary)' }}>
                {mode === 'safe'
                  ? 'Byte-Identical Pixels'
                  : mode === 'disrupt'
                  ? 'Pixel Perturbation'
                  : 'Full Re-encode'}
              </span>
            </div>

            <SegmentedControl
              options={[
                { value: 'safe', label: 'Safe (Metadata-Only)' },
                { value: 'disrupt', label: 'Disrupt (Watermarks)' },
                { value: 'convert', label: 'High-Quality Convert' },
              ]}
              value={mode}
              onChange={(val) => handleModeChange(val as ProcessingMode)}
            />

            {/* Mode Disclosure Callout */}
            <div className={`mode-callout mode-callout--${mode}`}>
              <div className="mode-callout__icon">
                {mode === 'safe' && <Lock size={15} strokeWidth={1.5} />}
                {mode === 'disrupt' && <Zap size={15} strokeWidth={1.5} />}
                {mode === 'convert' && <Sparkles size={15} strokeWidth={1.5} />}
              </div>
              <p className="type-body mode-callout__text">
                {mode === 'safe' && (
                  <>
                    <strong>Safe Mode:</strong> Whitelist-based container reconstruction. Removes EXIF,
                    GPS, XMP, IPTC, and AI prompt chunks with <em>zero pixel changes</em>. Does not
                    remove invisible pixel watermarks (e.g. SynthID).
                  </>
                )}
                {mode === 'disrupt' && (
                  <>
                    <strong>Disrupt Mode:</strong> Applies quality-gated imperceptible pixel perturbations
                    (PSNR &gt; 45dB) to disrupt invisible frequency-domain watermarks. <em>Alters pixels slightly; best-effort, not guaranteed against deep AI detectors.</em>
                  </>
                )}
                {mode === 'convert' && (
                  <>
                    <strong>Convert Mode:</strong> Full format conversion using high-fidelity WebAssembly
                    codecs. Decodes image and cleanly strips container metadata during re-encoding.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Forensic Stat Grid */}
          <div className="forensic-stat-grid">
            <div className="forensic-stat-card">
              <span className="forensic-stat-card__number">{personal.length}</span>
              <span className="forensic-stat-card__label">Personal Info</span>
            </div>
            <div className="forensic-stat-card">
              <span className="forensic-stat-card__number">{location.length}</span>
              <span className="forensic-stat-card__label">GPS Locations</span>
            </div>
            <div className="forensic-stat-card">
              <span className="forensic-stat-card__number">{device.length}</span>
              <span className="forensic-stat-card__label">Hardware & Lens</span>
            </div>
            <div className="forensic-stat-card">
              <span className="forensic-stat-card__number">{software.length}</span>
              <span className="forensic-stat-card__label">Software / AI</span>
            </div>
            <div className="forensic-stat-card">
              <span className="forensic-stat-card__number">{provenance.length}</span>
              <span className="forensic-stat-card__label">Provenance / C2PA</span>
            </div>
          </div>

          {/* Tab Selector: Inspection vs Independent Verification Report */}
          <div className="forensic-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('inspection')}
              className={`forensic-tab ${activeTab === 'inspection' ? 'forensic-tab--active' : ''}`}
            >
              Layer Inspection ({filtered.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('verification')}
              className={`forensic-tab ${activeTab === 'verification' ? 'forensic-tab--active' : ''}`}
            >
              Independent Audit
              {verification && (
                <span className={`tab-indicator tab-indicator--${verification.status.toLowerCase()}`} />
              )}
            </button>
          </div>

          {/* TAB 1: Inspection & Granular Layer Inspection */}
          {activeTab === 'inspection' && (
            <div className="forensic-inspection-view">
              {/* Filter & Layer Controls */}
              <div className="forensic-filter-row">
                <div className="forensic-search">
                  <Search size={14} strokeWidth={1.5} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Search metadata tags, paths, values..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="forensic-search__input"
                  />
                </div>

                <div className="layer-pills">
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('all')}
                    className={`layer-pill ${selectedLayer === 'all' ? 'layer-pill--active' : ''}`}
                  >
                    All Layers
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('A')}
                    className={`layer-pill ${selectedLayer === 'A' ? 'layer-pill--active' : ''}`}
                    title="Standard EXIF, XMP, IPTC"
                  >
                    Layer A (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('B')}
                    className={`layer-pill ${selectedLayer === 'B' ? 'layer-pill--active' : ''}`}
                    title="Container Segments & Chunks"
                  >
                    Layer B (Container)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('C')}
                    className={`layer-pill ${selectedLayer === 'C' ? 'layer-pill--active' : ''}`}
                    title="Application & AI Parameters"
                  >
                    Layer C (Application)
                  </button>
                </div>
              </div>

              {/* Tag Rows List */}
              <div className="forensic-list">
                {filtered.length === 0 ? (
                  <p className="type-mono metadata-empty">No matching metadata fields detected.</p>
                ) : (
                  filtered.map((item) => {
                    const isRemove = item.action === 'remove';
                    return (
                      <div
                        key={item.id}
                        className={`forensic-row ${isRemove ? 'forensic-row--remove' : 'forensic-row--keep'}`}
                        onClick={() => item.removable && toggleAction(item.id)}
                        title={item.removable ? `Click to ${isRemove ? 'keep' : 'remove'} this tag` : 'Required for image rendering'}
                      >
                        <div className="forensic-row__left">
                          <div className="forensic-row__title-line">
                            <span className="type-mono forensic-row__name">{item.name}</span>
                            <span className={`category-tag category-tag--${item.category}`}>
                              {item.category}
                            </span>
                            <span className="type-mono forensic-row__layer">Layer {item.layer}</span>
                          </div>
                          <span className="forensic-row__location">{item.location}</span>
                          <span className="forensic-row__value">{item.value}</span>
                        </div>

                        <div className="forensic-row__right">
                          {item.removable ? (
                            <span className={`status-pill ${isRemove ? 'status-pill--remove' : 'status-pill--keep'}`}>
                              {isRemove ? 'Will Remove' : 'Will Keep'}
                            </span>
                          ) : (
                            <span className="status-pill status-pill--locked">Essential</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Independent Verification Audit */}
          {activeTab === 'verification' && (
            <div className="forensic-verification-view">
              {!verification ? (
                <div className="verification-empty-state">
                  <Info size={24} strokeWidth={1.5} color="var(--text-muted)" />
                  <p className="type-body" style={{ marginTop: 'var(--space-2)' }}>
                    No independent verification performed yet. Click <strong>"Sanitize & Export"</strong> below to execute container reconstruction and trigger the post-sanitization binary audit.
                  </p>
                </div>
              ) : (
                <div className="verification-report-box">
                  <div className="verification-report-header">
                    <div>
                      <span className="type-eyebrow">Independent Binary Audit</span>
                      <h4 className="type-editorial" style={{ fontSize: '1.25rem' }}>
                        {verification.status === 'VERIFIED' ? 'Sanitization Verified' : 'Audit Flagged Issues'}
                      </h4>
                      <p className="type-body" style={{ fontSize: '0.8125rem' }}>
                        {verification.checksPassed} of {verification.checksTotal} integrity & privacy checks confirmed.
                      </p>
                    </div>

                    <Badge variant={verification.status === 'VERIFIED' ? 'success' : 'danger'}>
                      {verification.status}
                    </Badge>
                  </div>

                  <div className="verification-checks-list">
                    {verification.checks.map((chk) => (
                      <div key={chk.id} className="verification-check-row">
                        <div className="verification-check-row__icon">
                          {chk.passed ? (
                            <CheckCircle2 size={16} strokeWidth={2} color="var(--success)" />
                          ) : (
                            <AlertTriangle size={16} strokeWidth={2} color="var(--danger-text)" />
                          )}
                        </div>
                        <div className="verification-check-row__content">
                          <span className="type-mono verification-check-row__name">{chk.name}</span>
                          <p className="type-body verification-check-row__details">{chk.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
