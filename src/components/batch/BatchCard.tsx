import { Check, AlertCircle, Download, Loader2, ArrowRight } from 'lucide-react';
import { FileEntry } from '../../core/types';
import { formatBytes } from '../../core/pipeline/validate';
import { useStore } from '../../store';
import { ProgressBar } from '../ui/ProgressBar';

export function BatchCard({ file }: { file: FileEntry }) {
  const setActiveFile = useStore((s) => s.setActiveFile);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const processSingle = useStore((s) => s.processSingle);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file.processedBlob) return;
    const url = URL.createObjectURL(file.processedBlob);
    const a = document.createElement('a');
    a.href = url;
    const ext = file.outputFormat.toLowerCase();
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    a.download = `${baseName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleClick = () => {
    setActiveFile(file.id);
    setCurrentView('workspace');
  };

  return (
    <div className="batch-card" onClick={handleClick}>
      <div className="batch-card__thumb">
        <img src={file.previewUrl} alt="" />
      </div>

      <div className="batch-card__info">
        <span className="batch-card__name">{file.name}</span>
        <span className="type-mono batch-card__meta">
          {file.format} → {file.outputFormat} · {formatBytes(file.outputSize ?? file.size)}
        </span>
        {file.status === 'processing' && (
          <div style={{ marginTop: 6, maxWidth: 200 }}>
            <ProgressBar progress={file.progress} />
          </div>
        )}
      </div>

      <div className="batch-card__status">
        {file.status === 'done' && (
          <span className="status status--success">
            <Check size={14} strokeWidth={2} /> Ready
          </span>
        )}
        {file.status === 'error' && (
          <span className="status status--error" title={file.errorMessage}>
            <AlertCircle size={14} strokeWidth={2} /> Failed
          </span>
        )}
        {file.status === 'processing' && (
          <span className="status" style={{ color: 'var(--accent-primary)' }}>
            <Loader2 size={14} className="spin-icon" strokeWidth={2} /> {file.progress}%
          </span>
        )}
        {file.status === 'idle' && (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              processSingle(file.id);
            }}
          >
            Process
          </button>
        )}
      </div>

      {file.status === 'done' ? (
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          aria-label="Download"
          onClick={handleDownload}
          title="Download single file"
        >
          <Download size={14} strokeWidth={1.5} />
        </button>
      ) : (
        <div style={{ width: 28 }} />
      )}
    </div>
  );
}

