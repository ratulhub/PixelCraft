import React, { useState, useRef } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Eye, Columns, Check } from 'lucide-react';
import { FileEntry } from '../../core/types';
import { useStore } from '../../store';

export function ImagePreview({ file }: { file: FileEntry }) {
  const [zoomFit, setZoomFit] = useState(true);
  const [showProcessed, setShowProcessed] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [splitPos, setSplitPos] = useState(50); // percentage 0-100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updateActiveFile = useStore((s) => s.updateActiveFile);

  const rotate = () => {
    const current = file.orientation ?? 0;
    updateActiveFile({ orientation: (current + 90) % 360 });
  };

  const processedUrl = file.processedBlob ? URL.createObjectURL(file.processedBlob) : null;
  const activeUrl = showProcessed && processedUrl ? processedUrl : file.previewUrl;

  const handlePointerDown = () => {
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPos(pct);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="preview">
      <div className="preview__toolbar">
        <div className="preview__toolbar-left">
          {file.processedBlob && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSplitMode(false);
                  setShowProcessed(!showProcessed);
                }}
                className={`preview__pill ${showProcessed && !splitMode ? 'preview__pill--active' : ''}`}
              >
                <Eye size={12} strokeWidth={1.5} />
                <span>{showProcessed && !splitMode ? 'Showing Output' : 'Showing Source'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitMode(!splitMode)}
                className={`preview__pill ${splitMode ? 'preview__pill--active' : ''}`}
                title="Interactive Before / After Split Slider"
              >
                <Columns size={12} strokeWidth={1.5} />
                <span>Split Compare</span>
              </button>
            </>
          )}
        </div>

        <div className="preview__toolbar-right">
          <button
            type="button"
            onClick={() => setZoomFit(!zoomFit)}
            className="preview__icon-btn"
            title={zoomFit ? 'Zoom 1:1' : 'Fit to container'}
          >
            {zoomFit ? <ZoomIn size={14} strokeWidth={1.5} /> : <ZoomOut size={14} strokeWidth={1.5} />}
          </button>
          <button
            type="button"
            onClick={rotate}
            className="preview__icon-btn"
            title="Rotate 90°"
          >
            <RotateCw size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`preview__checker ${!zoomFit ? 'preview__checker--scroll' : ''}`}
        onPointerMove={splitMode ? handlePointerMove : undefined}
        onPointerUp={splitMode ? handlePointerUp : undefined}
      >
        {splitMode && processedUrl ? (
          <div className="split-view-container">
            {/* Base: Sanitized Output */}
            <img
              src={processedUrl}
              alt="Processed"
              className="preview__img preview__img--fit"
              style={{ transform: `rotate(${file.orientation ?? 0}deg)` }}
            />

            {/* Overlay: Original Source clipped by splitPos */}
            <div
              className="split-view-clip"
              style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
            >
              <img
                src={file.previewUrl}
                alt="Original"
                className="preview__img preview__img--fit"
                style={{ transform: `rotate(${file.orientation ?? 0}deg)` }}
              />
            </div>

            {/* Split Divider Handle */}
            <div
              className="split-handle"
              style={{ left: `${splitPos}%` }}
              onPointerDown={handlePointerDown}
            >
              <div className="split-handle-line" />
              <div className="split-handle-knob">
                <Columns size={12} strokeWidth={2} />
              </div>
            </div>

            {/* Labels */}
            <span className="split-label split-label--before">Original</span>
            <span className="split-label split-label--after">Sanitized</span>
          </div>
        ) : (
          <img
            src={activeUrl}
            alt={file.name}
            className={`preview__img ${zoomFit ? 'preview__img--fit' : 'preview__img--actual'}`}
            style={{ transform: `rotate(${file.orientation ?? 0}deg)` }}
          />
        )}
      </div>
    </div>
  );
}
