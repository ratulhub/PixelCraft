import { useStore } from '../../store';
import { ImagePreview } from './ImagePreview';
import { FileMetaBar } from './FileMetaBar';
import { MetadataPanel } from './MetadataPanel';
import { ConversionPanel } from './ConversionPanel';
import { PresetBar } from './PresetBar';
import { AdvancedSettings } from './AdvancedSettings';
import { Plus, X, Layers, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

export function Workspace() {
  const activeFile = useStore((s) => s.activeFile);
  const files = useStore((s) => s.files);
  const setActiveFile = useStore((s) => s.setActiveFile);
  const removeFile = useStore((s) => s.removeFile);
  const clearFiles = useStore((s) => s.clearFiles);
  const addFiles = useStore((s) => s.addFiles);
  const setCurrentView = useStore((s) => s.setCurrentView);

  if (!activeFile) return null;

  return (
    <div className="workspace-container">
      {/* Filmstrip when multiple files are loaded */}
      {files.length > 1 && (
        <div className="filmstrip">
          <div className="filmstrip__inner">
            <div className="filmstrip__items">
              {files.map((f) => (
                <div
                  key={f.id}
                  className={`filmstrip__item ${f.id === activeFile.id ? 'filmstrip__item--active' : ''}`}
                  onClick={() => setActiveFile(f.id)}
                >
                  <img src={f.previewUrl} alt="" className="filmstrip__thumb" />
                  <span className="filmstrip__name">{f.name}</span>
                  <button
                    type="button"
                    className="filmstrip__remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(f.id);
                    }}
                    title="Remove file"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>

            <div className="filmstrip__actions">
              <label className="btn btn--secondary btn--sm">
                <Plus size={14} strokeWidth={1.5} />
                Add
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => {
                    const fls = Array.from(e.target.files ?? []);
                    if (fls.length) addFiles(fls);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => setCurrentView('batch')}
                className="btn btn--secondary btn--sm"
              >
                <Layers size={14} strokeWidth={1.5} />
                Batch View
              </button>

              <button
                type="button"
                onClick={clearFiles}
                className="btn btn--ghost btn--sm"
                title="Clear all files"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="workspace">
        <div className="workspace__preview-col">
          <ImagePreview file={activeFile} />
          <FileMetaBar file={activeFile} />
        </div>

        <div className="workspace__settings-col">
          <PresetBar />
          <MetadataPanel file={activeFile} />
          <ConversionPanel file={activeFile} />
          <AdvancedSettings file={activeFile} />
        </div>
      </div>
    </div>
  );
}

