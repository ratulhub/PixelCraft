export const SUPPORTED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'avif', 'jxl',
  'heic', 'heif', 'dng', 'cr2', 'cr3', 'nef', 'arw', 'raf', 'orf', 'rw2',
  'tif', 'tiff', 'bmp', 'ico', 'gif', 'apng', 'svg'
]);

export function isSupportedFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext ? SUPPORTED_EXTENSIONS.has(ext) : false;
}

export function detectFormat(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'jpeg') return 'JPG';
  if (ext) return ext.toUpperCase();
  if (file.type) {
    const sub = file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN';
    return sub === 'JPEG' ? 'JPG' : sub;
  }
  return 'UNKNOWN';
}

export function isLossy(format: string): boolean {
  const f = format.toUpperCase();
  return f === 'JPG' || f === 'JPEG' || f === 'WEBP' || f === 'AVIF' || f === 'HEIC';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

