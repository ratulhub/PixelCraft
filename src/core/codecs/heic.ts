/**
 * HEIC / HEIF Decoder using libheif-js WASM bundle
 */

export async function decodeHeic(file: File | Blob): Promise<ImageData> {
  const libheifModule = await import('libheif-js/wasm-bundle.js');
  const libheif = libheifModule.default || libheifModule;
  const decoder = new (libheif.HeifDecoder || libheif)();
  const buffer = await file.arrayBuffer();
  const images = decoder.decode(buffer);

  if (!images || !images.length) {
    throw new Error('No image found inside HEIC file');
  }

  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();

  return new Promise((resolve, reject) => {
    image.display(
      { data: new Uint8ClampedArray(width * height * 4), width, height },
      (data: any) => {
        if (!data) return reject(new Error('HEIC display decode failed'));
        resolve(new ImageData(data.data, width, height));
      }
    );
  });
}

