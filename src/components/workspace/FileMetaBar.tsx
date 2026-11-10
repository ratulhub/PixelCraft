import { Badge } from '../ui/Badge';
import { FileEntry } from '../../core/types';
import { formatBytes } from '../../core/pipeline/validate';

export function FileMetaBar({ file }: { file: FileEntry }) {
  const isDone = file.status === 'done' && file.outputSize;
  const savedBytes = isDone ? file.size - file.outputSize! : 0;
  const savedPercent = isDone && file.size > 0 ? Math.round((savedBytes / file.size) * 100) : 0;

  return (
    <div className="meta-bar">
      <div className="meta-bar__name-row">
        <span className="meta-bar__name" title={file.name}>
          {file.name}
        </span>
        <Badge variant="mono">{file.format}</Badge>
        {isDone && (
          <Badge variant={savedPercent > 0 ? 'success' : 'neutral'}>
            {savedPercent > 0 ? `-${savedPercent}%` : 'Lossless'}
          </Badge>
        )}
      </div>

      <div className="meta-bar__stats">
        <span className="type-mono">
          {file.width} × {file.height}
        </span>
        <span className="meta-bar__dot" />
        <span className="type-mono">Original: {formatBytes(file.size)}</span>
        {isDone && (
          <>
            <span className="meta-bar__dot" />
            <span className="type-mono" style={{ color: 'var(--success)', fontWeight: 500 }}>
              Output: {formatBytes(file.outputSize!)}
            </span>
          </>
        )}
        <span className="meta-bar__dot" />
        <span className="type-mono">{file.colorProfile ?? 'sRGB'}</span>
        {file.processTimeMs && (
          <>
            <span className="meta-bar__dot" />
            <span className="type-mono">{file.processTimeMs}ms</span>
          </>
        )}
      </div>
    </div>
  );
}

