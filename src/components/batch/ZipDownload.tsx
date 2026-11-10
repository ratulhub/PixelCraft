import { useState } from 'react';
import { Download, Loader2, Archive } from 'lucide-react';
import { zip } from 'fflate';
import { FileEntry } from '../../core/types';
import { Button } from '../ui/Button';

export function ZipDownload({ files }: { files: FileEntry[] }) {
  const [zipping, setZipping] = useState(false);
  const doneFiles = files.filter((f) => f.status === 'done' && f.processedBlob);

  const handleZipDownload = async () => {
    if (doneFiles.length === 0) return;
    setZipping(true);

    try {
      const zipData: Record<string, Uint8Array> = {};

      for (const entry of doneFiles) {
        if (!entry.processedBlob) continue;
        const arrayBuf = await entry.processedBlob.arrayBuffer();
        const ext = entry.outputFormat.toLowerCase();
        const baseName = entry.name.substring(0, entry.name.lastIndexOf('.')) || entry.name;
        const filename = `${baseName}.${ext}`;
        zipData[filename] = new Uint8Array(arrayBuf);
      }

      zip(zipData, { level: 0 }, (err, data) => {
        setZipping(false);
        if (err) {
          alert('Could not generate ZIP archive: ' + err.message);
          return;
        }

        const blob = new Blob([data], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixelcraft-batch-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      });
    } catch (err) {
      setZipping(false);
      console.error('ZIP error:', err);
    }
  };

  return (
    <Button
      variant="primary"
      onClick={handleZipDownload}
      disabled={zipping || doneFiles.length === 0}
    >
      {zipping ? (
        <>
          <Loader2 size={16} className="spin-icon" strokeWidth={1.5} />
          Compressing ZIP...
        </>
      ) : (
        <>
          <Archive size={16} strokeWidth={1.5} />
          Download all as ZIP ({doneFiles.length})
        </>
      )}
    </Button>
  );
}

