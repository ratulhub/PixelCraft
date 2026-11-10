import { Check, AlertCircle, ArrowLeft, Play, Loader2 } from 'lucide-react';
import { useStore } from '../../store';
import { BatchCard } from './BatchCard';
import { ZipDownload } from './ZipDownload';
import { Button } from '../ui/Button';

export function BatchResults() {
  const files = useStore((s) => s.files);
  const done = files.filter((f) => f.status === 'done');
  const isProcessingBatch = useStore((s) => s.isProcessingBatch);
  const processAll = useStore((s) => s.processAll);
  const setCurrentView = useStore((s) => s.setCurrentView);

  return (
    <div className="batch">
      <div className="batch__header">
        <div>
          <button
            type="button"
            onClick={() => setCurrentView('workspace')}
            className="batch__back-btn"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back to Single Workspace
          </button>
          <p className="type-eyebrow" style={{ marginTop: 'var(--space-2)' }}>
            Batch Operations
          </p>
          <p className="type-body">
            {done.length} of {files.length} files processed
          </p>
        </div>

        <div className="batch__header-actions">
          {done.length < files.length && (
            <Button
              variant="secondary"
              onClick={() => processAll()}
              disabled={isProcessingBatch}
            >
              {isProcessingBatch ? (
                <>
                  <Loader2 size={16} className="spin-icon" strokeWidth={1.5} />
                  Processing Batch...
                </>
              ) : (
                <>
                  <Play size={15} strokeWidth={1.5} />
                  Process All
                </>
              )}
            </Button>
          )}

          <ZipDownload files={files} />
        </div>
      </div>

      <div className="batch__list">
        {files.map((file) => (
          <BatchCard key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
}

