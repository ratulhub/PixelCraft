import { Upload, Sparkles, Camera, Image as ImageIcon, Cpu, FileCode } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useStore } from '../../store';

export function DropZone() {
  const [dragging, setDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const addFiles = useStore((s) => s.addFiles);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/') ||
        /\.(heic|heif|dng|cr2|cr3|nef|arw|raf|orf|rw2|tif|tiff|jxl|svg|gif|png|jpg|jpeg|webp|avif)$/i.test(f.name)
      );
      if (files.length) addFiles(files);
    },
    [addFiles]
  );

  const loadSample = async (url: string, filename: string, mime: string) => {
    try {
      setLoadingSample(true);
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: mime });
      await addFiles([file]);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="dropzone-wrapper">
      <div
        className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="dropzone__icon">
          <Upload size={20} strokeWidth={1.5} />
        </div>
        <p className="dropzone__title">Drop images here</p>
        <p className="type-mono dropzone__hint">
          JPG · PNG · WebP · AVIF · HEIC · RAW · TIFF · JXL · GIF · SVG
        </p>
        <label className="btn btn--primary dropzone__browse">
          Browse files
          <input
            type="file"
            multiple
            accept="image/*,.heic,.heif,.dng,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2,.tif,.tiff,.jxl"
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) addFiles(files);
            }}
          />
        </label>
      </div>

      {/* Quick Sample Selector for Instant Verification */}
      <div className="sample-bar">
        <span className="type-eyebrow sample-bar__label">Test with deep metadata fixtures:</span>
        <div className="sample-bar__buttons">
          <button
            type="button"
            className="sample-btn"
            disabled={loadingSample}
            onClick={() =>
              loadSample(
                '/samples/photoshop-leica-gps.jpg',
                'leica-q3-paris-gps.jpg',
                'image/jpeg'
              )
            }
          >
            <Camera size={13} strokeWidth={1.5} />
            <span>Leica (GPS, EXIF, IPTC)</span>
          </button>

          <button
            type="button"
            className="sample-btn"
            disabled={loadingSample}
            onClick={() =>
              loadSample(
                '/samples/stablediffusion-prompt.png',
                'stable-diffusion-portrait.png',
                'image/png'
              )
            }
          >
            <Sparkles size={13} strokeWidth={1.5} />
            <span>Stable Diffusion (zTXt Prompt)</span>
          </button>

          <button
            type="button"
            className="sample-btn"
            disabled={loadingSample}
            onClick={() =>
              loadSample(
                '/samples/comfyui-graph.png',
                'comfyui-workflow-graph.png',
                'image/png'
              )
            }
          >
            <Cpu size={13} strokeWidth={1.5} />
            <span>ComfyUI (iTXt Node Graph)</span>
          </button>

          <button
            type="button"
            className="sample-btn"
            disabled={loadingSample}
            onClick={() =>
              loadSample(
                '/samples/chatgpt-c2pa.png',
                'chatgpt-dalle-c2pa.png',
                'image/png'
              )
            }
          >
            <FileCode size={13} strokeWidth={1.5} />
            <span>C2PA Content Credentials</span>
          </button>
        </div>
      </div>
    </div>
  );
}
