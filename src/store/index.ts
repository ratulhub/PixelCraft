import { create } from 'zustand';
import { FileEntry, MetadataEntry, ProcessingStatus, ProcessingMode, VerificationReport } from '../core/types';
import { detectFormat } from '../core/pipeline/validate';
import { scanDeepMetadata } from '../core/metadata/scanner';
import { processFile } from '../core/pipeline/processFile';
import { extractRawEmbeddedPreview } from '../core/codecs/raw';

export type AppView = 'home' | 'workspace' | 'batch' | 'formats' | 'privacy';
export type PresetMode = 'web-balanced' | 'archive-lossless' | 'privacy-pure' | 'disrupt' | 'custom';

interface AppStore {
  files: FileEntry[];
  activeFileId: string | null;
  activeFile: FileEntry | null;
  currentView: AppView;
  preset: PresetMode;
  isProcessingBatch: boolean;

  // Actions
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setActiveFile: (id: string) => void;
  updateActiveFile: (updates: Partial<FileEntry>) => void;
  updateFile: (id: string, updates: Partial<FileEntry>) => void;
  applyPreset: (preset: PresetMode) => void;
  processSingle: (id: string) => Promise<void>;
  processAll: () => Promise<void>;
  setCurrentView: (view: AppView) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  files: [],
  activeFileId: null,
  activeFile: null,
  currentView: 'home',
  preset: 'web-balanced',
  isProcessingBatch: false,

  setCurrentView: (view) => set({ currentView: view }),

  setActiveFile: (id) => {
    const file = get().files.find((f) => f.id === id) || null;
    set({ activeFileId: id, activeFile: file });
  },

  updateFile: (id, updates) => {
    const files = get().files.map((f) => (f.id === id ? { ...f, ...updates } : f));
    const activeFile = get().activeFileId === id && get().activeFile ? { ...get().activeFile!, ...updates } : get().activeFile;
    set({ files, activeFile });
  },

  updateActiveFile: (updates) => {
    const activeId = get().activeFileId;
    if (!activeId) return;
    get().updateFile(activeId, updates);
  },

  removeFile: (id) => {
    const files = get().files.filter((f) => f.id !== id);
    const nextActive = files.length > 0 ? files[0] : null;
    set({
      files,
      activeFileId: nextActive ? nextActive.id : null,
      activeFile: nextActive,
      currentView: files.length === 0 ? 'home' : get().currentView,
    });
  },

  clearFiles: () => {
    get().files.forEach((f) => {
      if (f.previewUrl && f.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    set({ files: [], activeFileId: null, activeFile: null, currentView: 'home' });
  },

  applyPreset: (preset) => {
    const current = get();
    let updates: Partial<FileEntry> = {};

    if (preset === 'web-balanced') {
      updates = {
        mode: 'convert',
        outputFormat: 'WebP',
        quality: 85,
        lossless: false,
        stripPersonalMetadata: true,
        stripGPS: true,
        stripDeviceSoftware: true,
        stripCommentsDescriptions: true,
        stripAIWorkflowParameters: true,
        stripC2PA: false,
        preserveColorProfile: true,
        preserveOrientation: true,
        preserveTransparency: true,
        preserveAnimation: true,
      };
    } else if (preset === 'privacy-pure') {
      updates = {
        mode: 'safe',
        outputFormat: current.activeFile?.format || 'JPG',
        quality: 100,
        lossless: false,
        stripPersonalMetadata: true,
        stripGPS: true,
        stripDeviceSoftware: true,
        stripCommentsDescriptions: true,
        stripAIWorkflowParameters: true,
        stripC2PA: true,
        preserveColorProfile: false,
        preserveOrientation: true,
        preserveTransparency: true,
        preserveAnimation: true,
      };
    } else if (preset === 'archive-lossless') {
      updates = {
        mode: 'safe',
        outputFormat: current.activeFile?.format || 'PNG',
        quality: 100,
        lossless: true,
        stripPersonalMetadata: false,
        stripGPS: false,
        stripDeviceSoftware: false,
        stripCommentsDescriptions: false,
        stripAIWorkflowParameters: false,
        stripC2PA: false,
        preserveColorProfile: true,
        preserveOrientation: true,
        preserveTransparency: true,
        preserveAnimation: true,
      };
    } else if (preset === 'disrupt') {
      updates = {
        mode: 'disrupt',
        outputFormat: current.activeFile?.format || 'JPG',
        quality: 92,
        lossless: false,
        disruptStrength: 0.35,
        stripPersonalMetadata: true,
        stripGPS: true,
        stripDeviceSoftware: true,
        stripCommentsDescriptions: true,
        stripAIWorkflowParameters: true,
        stripC2PA: true,
        preserveColorProfile: true,
        preserveOrientation: true,
        preserveTransparency: true,
        preserveAnimation: true,
      };
    }

    set({ preset });
    if (current.activeFileId) {
      current.updateActiveFile(updates);
    }
  },

  addFiles: async (newFiles: File[]) => {
    const entries: FileEntry[] = [];

    for (const file of newFiles) {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const format = detectFormat(file);

      // Determine initial preview URL
      let previewUrl = '';
      const isRaw = ['DNG', 'CR2', 'CR3', 'NEF', 'ARW', 'RAF', 'ORF', 'RW2'].includes(format);

      if (isRaw) {
        try {
          const embedded = await extractRawEmbeddedPreview(file);
          if (embedded) {
            previewUrl = URL.createObjectURL(embedded);
          } else {
            previewUrl = URL.createObjectURL(file);
          }
        } catch {
          previewUrl = URL.createObjectURL(file);
        }
      } else {
        previewUrl = URL.createObjectURL(file);
      }

      // Initial dimensions
      let width = 0;
      let height = 0;
      try {
        const img = new Image();
        img.src = previewUrl;
        await new Promise((res) => {
          img.onload = () => {
            width = img.naturalWidth || img.width;
            height = img.naturalHeight || img.height;
            res(true);
          };
          img.onerror = () => res(false);
        });
      } catch {
        // Fallback
      }

      const entry: FileEntry = {
        id,
        file,
        name: file.name,
        size: file.size,
        format,
        width: width || 1920,
        height: height || 1080,
        previewUrl,
        status: 'scanning',
        progress: 0,
        metadata: [],

        // Multi-mode configuration
        mode: 'safe',
        outputFormat: format === 'HEIC' || isRaw ? 'JPG' : format === 'SVG' ? 'PNG' : format,
        quality: 100,
        lossless: false,
        stripPersonalMetadata: true,
        stripGPS: true,
        stripDeviceSoftware: true,
        stripCommentsDescriptions: true,
        stripAIWorkflowParameters: true,
        stripC2PA: false,
        preserveColorProfile: true,
        preserveOrientation: true,
        preserveTransparency: true,
        preserveAnimation: true,
        rawMode: 'preview',
        disruptStrength: 0.35,
      };

      entries.push(entry);
    }

    const updatedFiles = [...get().files, ...entries];
    const firstNew = entries[0];
    const nextActive = get().activeFile || firstNew;

    set({
      files: updatedFiles,
      activeFileId: nextActive ? nextActive.id : null,
      activeFile: nextActive,
      currentView: 'workspace',
    });

    // Deep Multi-Layer Binary Metadata Scan
    for (const entry of entries) {
      try {
        const scanReport = await scanDeepMetadata(entry.file, {
          stripC2PA: entry.stripC2PA,
          stripGPS: entry.stripGPS,
          stripPersonalMetadata: entry.stripPersonalMetadata,
        });

        get().updateFile(entry.id, {
          metadata: scanReport.entries,
          width: scanReport.width || entry.width,
          height: scanReport.height || entry.height,
          orientation: scanReport.orientation ?? entry.orientation,
          colorProfile: scanReport.colorProfile || entry.colorProfile,
          status: 'idle',
        });
      } catch (err) {
        console.warn('[PixelCraft] Deep metadata scan warning for', entry.name, err);
        get().updateFile(entry.id, { status: 'idle' });
      }
    }
  },

  processSingle: async (id: string) => {
    const file = get().files.find((f) => f.id === id);
    if (!file) return;

    get().updateFile(id, { status: 'processing', progress: 5, errorMessage: undefined });

    try {
      const result = await processFile(file, (progress: number) => {
        get().updateFile(id, { progress });
      });

      get().updateFile(id, {
        status: 'done',
        progress: 100,
        processedBlob: result.blob,
        outputSize: result.outputSize,
        processTimeMs: result.processTimeMs,
        verificationReport: result.verificationReport,
      });
    } catch (err) {
      console.error('Processing failed:', err);
      get().updateFile(id, {
        status: 'error',
        progress: 0,
        errorMessage: (err as Error).message || 'Sanitization failed',
      });
    }
  },

  processAll: async () => {
    const files = get().files;
    if (files.length === 0) return;

    set({ isProcessingBatch: true, currentView: 'batch' });

    for (const file of files) {
      await get().processSingle(file.id);
    }

    set({ isProcessingBatch: false });
  },
}));
