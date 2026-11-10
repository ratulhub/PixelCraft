import { Download, Sparkles, Check, Loader2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { FileEntry } from '../../core/types';
import { isLossy, formatBytes } from '../../core/pipeline/validate';
import { useStore } from '../../store';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';

const FORMAT_GROUPS = [
  { label: 'Web', formats: ['JPG', 'PNG', 'WebP', 'AVIF'] },
  { label: 'Apple', formats: ['HEIC', 'DNG'] },
  { label: 'Standard', formats: ['TIFF', 'BMP', 'ICO'] },
  { label: 'Animated', formats: ['GIF'] },
  { label: 'Next-gen', formats: ['JXL'] },
];

export function ConversionPanel({ file }: { file: FileEntry }) {
  const updateActiveFile = useStore((s) => s.updateActiveFile);
  const processSingle = useStore((s) => s.processSingle);
  const files = useStore((s) => s.files);
  const processAll = useStore((s) => s.processAll);

  const isConverting = file.status === 'processing';
  const isDone = file.status === 'done';
  const mode = file.mode || 'safe';

  const handleDownload = () => {
    if (!file.processedBlob) return;
    const url = URL.createObjectURL(file.processedBlob);
    const a = document.createElement('a');
    a.href = url;
    const ext = file.outputFormat.toLowerCase();
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const suffix = mode === 'disrupt' ? 'disrupted' : 'clean';
    a.download = `${baseName}-${suffix}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <span className="type-eyebrow">Export Configuration</span>
        {isDone && file.outputSize && (
          <span className="type-mono" style={{ color: 'var(--success)' }}>
            Verified ({formatBytes(file.outputSize)})
          </span>
        )}
      </div>

      <div className="panel__body">
        {/* Output Format Picker (Active in Convert Mode or when user changes format) */}
        <div className="format-group">
          <div className="field__label-row">
            <p className="format-group__label">Target Container</p>
            {mode === 'safe' && (
              <span className="type-mono" style={{ color: 'var(--accent-primary)' }}>
                Matching Source Container ({file.format})
              </span>
            )}
          </div>
          <div className="format-group__grid">
            {FORMAT_GROUPS.map((group) =>
              group.formats.map((fmt) => {
                const isSelected = file.outputFormat.toUpperCase() === fmt.toUpperCase();
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      updateActiveFile({
                        outputFormat: fmt,
                        mode: fmt.toUpperCase() === file.format.toUpperCase() && mode === 'safe' ? 'safe' : 'convert',
                      });
                    }}
                    className={`format-chip ${isSelected ? 'format-chip--active' : ''}`}
                  >
                    {fmt}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Quality slider — for lossy formats or convert mode */}
        {(mode === 'convert' || isLossy(file.outputFormat)) && (
          <div className="field">
            <div className="field__label-row">
              <label className="field__label">Encoding Quality</label>
              <span className="type-mono">{file.quality}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={file.quality}
              onChange={(e) => updateActiveFile({ quality: Number(e.target.value) })}
              className="slider"
            />
          </div>
        )}

        {/* Disrupt Strength slider — only when Mode is 'disrupt' */}
        {mode === 'disrupt' && (
          <div className="field">
            <div className="field__label-row">
              <label className="field__label">Watermark Perturbation Intensity</label>
              <span className="type-mono">
                {Math.round((file.disruptStrength ?? 0.35) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round((file.disruptStrength ?? 0.35) * 100)}
              onChange={(e) => updateActiveFile({ disruptStrength: Number(e.target.value) / 100 })}
              className="slider"
            />
            <span className="type-mono" style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
              Subtle spatial and frequency perturbation to disrupt SynthID without visible degradation.
            </span>
          </div>
        )}

        {/* Action Row */}
        <div className="conversion-actions">
          {isDone ? (
            <div className="conversion-actions__done-row">
              <Button
                variant="primary"
                onClick={handleDownload}
                className="btn--full"
              >
                <Download size={16} strokeWidth={1.5} />
                Download Sanitized {file.outputFormat}
              </Button>
              <Button
                variant="secondary"
                onClick={() => processSingle(file.id)}
                title="Re-run pipeline with adjusted parameters"
              >
                Re-scan & Run
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={() => processSingle(file.id)}
              disabled={isConverting}
              className="btn--full"
            >
              {isConverting ? (
                <>
                  <Loader2 size={16} className="spin-icon" strokeWidth={1.5} />
                  Sanitizing & Verifying ({file.progress}%)...
                </>
              ) : mode === 'safe' ? (
                <>
                  <ShieldCheck size={16} strokeWidth={1.5} />
                  Sanitize & Reconstruct Container
                  <ArrowRight size={15} strokeWidth={1.5} />
                </>
              ) : mode === 'disrupt' ? (
                <>
                  <Zap size={16} strokeWidth={1.5} />
                  Disrupt Watermarks & Sanitize
                  <ArrowRight size={15} strokeWidth={1.5} />
                </>
              ) : (
                <>
                  <Sparkles size={16} strokeWidth={1.5} />
                  Convert & Sanitize
                  <ArrowRight size={15} strokeWidth={1.5} />
                </>
              )}
            </Button>
          )}

          {files.length > 1 && (
            <Button
              variant="secondary"
              onClick={() => processAll()}
              className="btn--full"
              style={{ marginTop: 'var(--space-2)' }}
            >
              Process all {files.length} files in batch
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
