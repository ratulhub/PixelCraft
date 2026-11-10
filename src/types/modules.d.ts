declare module 'libheif-js/wasm-bundle.js' {
  const libheif: any;
  export default libheif;
}

declare module 'libheif-js' {
  const libheif: any;
  export default libheif;
}

declare module 'rawconvert-wasm/dist/worker-client.js' {
  export class RawConvertWorker {
    static init(options?: {
      workerUrl?: string | URL;
      coreUrl?: string | URL;
      wasmUrl?: string | URL;
    }): Promise<RawConvertWorker>;
    load(data: ArrayBuffer, filename?: string): Promise<any>;
    getMetadata(): Promise<any>;
    getThumbnail(): Promise<any>;
    process(options?: {
      colorSpace?: string;
      halfSize?: boolean;
    }): Promise<{ data: Uint8ClampedArray | number[]; width: number; height: number }>;
    reset(): Promise<any>;
    dispose(): void;
  }
}

