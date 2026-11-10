import { getCodec } from '../../codecs/registry';
import { decodeInput } from '../processFile';

self.onmessage = async (e: MessageEvent) => {
  const { id, file, outputFormat, options } = e.data;

  try {
    self.postMessage({ id, type: 'progress', value: 0.1 });

    const codec = await getCodec(outputFormat);
    const imageData = await decodeInput(file, options?.rawMode);

    self.postMessage({ id, type: 'progress', value: 0.55 });

    const encoded = await codec.encode(imageData, {
      quality: options?.quality ?? 85,
      lossless: options?.lossless ?? false,
    });

    self.postMessage({ id, type: 'progress', value: 0.9 });

    const blob = new Blob([encoded as any], { type: `image/${outputFormat}` });
    self.postMessage({ id, type: 'done', blob });
  } catch (err) {
    self.postMessage({ id, type: 'error', message: (err as Error).message });
  }
};
