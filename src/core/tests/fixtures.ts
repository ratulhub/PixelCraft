import { zlibSync, deflateSync } from 'fflate';

/**
 * Programmatic binary test fixture generator.
 * Produces real binary image containers with nested metadata structures.
 */

export function createPhotoshopJpegFixture(): ArrayBuffer {
  // Construct a valid JPEG with:
  // - SOI (0xFFD8)
  // - APP0 JFIF
  // - APP1 EXIF (IFD0 + SubIFD + GPS IFD)
  // - APP1 XMP (dc:creator, xmp:CreateDate)
  // - APP2 ICC Profile
  // - APP13 Photoshop IRB with IPTC (Author, Copyright, City)
  // - COM ("Photoshop 2026 Export")
  // - DQT, SOF0 (100x80), DHT, SOS, scan data, EOI

  const soi = Buffer.from([0xff, 0xd8]);

  // APP0 (JFIF)
  const app0 = Buffer.from([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48,
    0x00, 0x00,
  ]);

  // APP1 EXIF with nested SubIFD and GPSIFD
  const exifHeader = Buffer.from('Exif\0\0', 'ascii');
  const tiffHeader = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]); // "II", 42, offset 8

  // IFD0 entries: Make, Model, DateTimeOriginal, ExifOffset (0x8769), GPSInfoOffset (0x8825)
  const numIfd0 = 5;
  const ifd0 = Buffer.alloc(2 + numIfd0 * 12 + 4);
  ifd0.writeUInt16LE(numIfd0, 0);

  const valStart = 8 + ifd0.length + 2 + 3 * 12 + 4 + 2 + 4 * 12 + 4; // space for SubIFD and GPSIFD
  let offset = 2;
  function writeTag(buf: Buffer, off: number, tag: number, type: number, count: number, val: number) {
    buf.writeUInt16LE(tag, off);
    buf.writeUInt16LE(type, off + 2);
    buf.writeUInt32LE(count, off + 4);
    buf.writeUInt32LE(val, off + 8);
  }

  const makeStr = Buffer.from('Hasselblad X2D 100C\0', 'ascii');
  const modelStr = Buffer.from('XCD 2,5/38V\0', 'ascii');
  const artistStr = Buffer.from('Editorial Photographer\0', 'ascii');
  const dateStr = Buffer.from('2026:08:12 14:15:30\0', 'ascii');

  // Offset pointers for SubIFD and GPSIFD
  const subIfdOffset = 8 + ifd0.length;
  const gpsIfdOffset = subIfdOffset + 2 + 3 * 12 + 4;
  let dataPointer = gpsIfdOffset + 2 + 4 * 12 + 4;

  writeTag(ifd0, 2, 0x010f, 2, makeStr.length, dataPointer); // Make
  dataPointer += makeStr.length;

  writeTag(ifd0, 14, 0x0110, 2, modelStr.length, dataPointer); // Model
  dataPointer += modelStr.length;

  writeTag(ifd0, 26, 0x013b, 2, artistStr.length, dataPointer); // Artist
  dataPointer += artistStr.length;

  writeTag(ifd0, 38, 0x8769, 4, 1, subIfdOffset); // ExifOffset -> SubIFD
  writeTag(ifd0, 50, 0x8825, 4, 1, gpsIfdOffset); // GPSInfoOffset -> GPSIFD

  // Exif SubIFD (3 tags: DateTimeOriginal, ISO, ExposureTime)
  const subIfd = Buffer.alloc(2 + 3 * 12 + 4);
  subIfd.writeUInt16LE(3, 0);
  writeTag(subIfd, 2, 0x9003, 2, dateStr.length, dataPointer); // DateTimeOriginal
  dataPointer += dateStr.length;
  writeTag(subIfd, 14, 0x8827, 3, 1, 100); // ISO 100
  writeTag(subIfd, 26, 0xa434, 2, modelStr.length, 8 + ifd0.length + 30); // LensModel

  // GPS IFD (4 tags: GPSLatitudeRef 'N', GPSLatitude, GPSLongitudeRef 'E', GPSLongitude)
  const gpsIfd = Buffer.alloc(2 + 4 * 12 + 4);
  gpsIfd.writeUInt16LE(4, 0);
  writeTag(gpsIfd, 2, 0x0001, 2, 2, 0x4e); // 'N'
  writeTag(gpsIfd, 14, 0x0003, 2, 2, 0x45); // 'E'
  writeTag(gpsIfd, 26, 0x0002, 5, 3, dataPointer); // Latitude (3 rationals)
  dataPointer += 24;
  writeTag(gpsIfd, 38, 0x0004, 5, 3, dataPointer); // Longitude (3 rationals)
  dataPointer += 24;

  // Rational GPS coordinates: 48/1, 51/1, 24/1 -> Paris
  const gpsCoords = Buffer.alloc(48);
  gpsCoords.writeUInt32LE(48, 0); gpsCoords.writeUInt32LE(1, 4);
  gpsCoords.writeUInt32LE(51, 8); gpsCoords.writeUInt32LE(1, 12);
  gpsCoords.writeUInt32LE(24, 16); gpsCoords.writeUInt32LE(1, 20);
  gpsCoords.writeUInt32LE(2, 24); gpsCoords.writeUInt32LE(1, 28);
  gpsCoords.writeUInt32LE(21, 32); gpsCoords.writeUInt32LE(1, 36);
  gpsCoords.writeUInt32LE(7, 40); gpsCoords.writeUInt32LE(1, 44);

  const tiffBody = Buffer.concat([
    tiffHeader,
    ifd0,
    subIfd,
    gpsIfd,
    makeStr,
    modelStr,
    artistStr,
    dateStr,
    gpsCoords,
  ]);

  const app1ExifLen = 2 + exifHeader.length + tiffBody.length;
  const app1ExifLenBuf = Buffer.alloc(2);
  app1ExifLenBuf.writeUInt16BE(app1ExifLen, 0);
  const app1Exif = Buffer.concat([Buffer.from([0xff, 0xe1]), app1ExifLenBuf, exifHeader, tiffBody]);

  // APP1 XMP
  const xmpHeader = Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'ascii');
  const xmpXml = Buffer.from(
    `<x:xmpmeta xmlns:x="adobe:ns:meta/">
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
          <dc:creator><rdf:Seq><rdf:li>Senior Editorial Lead</rdf:li></rdf:Seq></dc:creator>
          <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">© 2026 Studio Archival</rdf:li></rdf:Alt></dc:rights>
          <photoshop:City>Paris</photoshop:City>
          <photoshop:Credit>Magnum Photos</photoshop:Credit>
        </rdf:Description>
      </rdf:RDF>
    </x:xmpmeta>`,
    'utf8'
  );
  const app1XmpLen = 2 + xmpHeader.length + xmpXml.length;
  const app1XmpLenBuf = Buffer.alloc(2);
  app1XmpLenBuf.writeUInt16BE(app1XmpLen, 0);
  const app1Xmp = Buffer.concat([Buffer.from([0xff, 0xe1]), app1XmpLenBuf, xmpHeader, xmpXml]);

  // APP2 (ICC Profile simulation)
  const iccHeader = Buffer.from('ICC_PROFILE\0\x01\x01', 'ascii');
  const iccPayload = Buffer.from('Display P3 Wide Gamut Matrix sRGB Embedded Profile', 'ascii');
  const app2Len = 2 + iccHeader.length + iccPayload.length;
  const app2LenBuf = Buffer.alloc(2);
  app2LenBuf.writeUInt16BE(app2Len, 0);
  const app2Icc = Buffer.concat([Buffer.from([0xff, 0xe2]), app2LenBuf, iccHeader, iccPayload]);

  // APP13 (Photoshop IRB with IPTC-NAA)
  const irbHeader = Buffer.from('Photoshop 3.0\0', 'ascii');
  const iptcRecord = Buffer.concat([
    Buffer.from([0x1c, 0x02, 0x50]), // 2:80 By-line
    Buffer.from([0x00, 0x0d]),
    Buffer.from('Master Artist', 'ascii'),
    Buffer.from([0x1c, 0x02, 0x74]), // 2:116 Copyright Notice
    Buffer.from([0x00, 0x0f]),
    Buffer.from('© Studio Paris', 'ascii'),
  ]);
  const irbBlockHeader = Buffer.from('8BIM\x04\x04\x00', 'ascii'); // 8BIM, ID 0x0404, empty name
  const irbBlockLen = Buffer.alloc(4);
  irbBlockLen.writeUInt32BE(iptcRecord.length, 0);
  const app13Payload = Buffer.concat([irbHeader, irbBlockHeader, irbBlockLen, iptcRecord]);
  const app13Len = 2 + app13Payload.length;
  const app13LenBuf = Buffer.alloc(2);
  app13LenBuf.writeUInt16BE(app13Len, 0);
  const app13 = Buffer.concat([Buffer.from([0xff, 0xed]), app13LenBuf, app13Payload]);

  // COM Segment
  const comText = Buffer.from('Exported from Adobe Photoshop 2026.4 via PixelCraft Test Suite', 'ascii');
  const comLen = 2 + comText.length;
  const comLenBuf = Buffer.alloc(2);
  comLenBuf.writeUInt16BE(comLen, 0);
  const com = Buffer.concat([Buffer.from([0xff, 0xfe]), comLenBuf, comText]);

  // Standard Image Segments: DQT, SOF0 (100x80), DHT, SOS, scan data, EOI
  const dqt = Buffer.from([
    0xff, 0xdb, 0x00, 0x43, 0x00,
    0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14,
    0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a,
    0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c,
    0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32
  ]);
  const sof0 = Buffer.from([
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x50, 0x00, 0x64, 0x01, 0x01, 0x11, 0x00
  ]); // 100x80 px
  const dht = Buffer.from([
    0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b
  ]);
  const sos = Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]);
  const scanData = Buffer.from([0xfd, 0xfc, 0xa0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const eoi = Buffer.from([0xff, 0xd9]);

  const trailing = Buffer.from('---STEGANOGRAPHY_TRAILING_PAYLOAD---', 'ascii');

  const full = Buffer.concat([
    soi,
    app0,
    app1Exif,
    app1Xmp,
    app2Icc,
    app13,
    com,
    dqt,
    sof0,
    dht,
    sos,
    scanData,
    eoi,
    trailing,
  ]);

  return full.buffer.slice(full.byteOffset, full.byteOffset + full.byteLength);
}

export function createStableDiffusionPngFixture(): ArrayBuffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function makeChunk(type: string, data: Uint8Array): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);

    let c = 0xffffffff;
    const combined = Buffer.concat([typeBuf, Buffer.from(data)]);
    for (let i = 0; i < combined.length; i++) {
      c = (c >>> 8) ^ CRC_TABLE[(c ^ combined[i]) & 0xff];
    }
    crc.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0);

    return Buffer.concat([len, typeBuf, Buffer.from(data), crc]);
  }

  // IHDR: 120x90, 8-bit, RGB
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(120, 0);
  ihdr.writeUInt32BE(90, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB

  // zTXt compressed parameters chunk (A1111 format)
  const paramText =
    'editorial medium format photograph of brutalist architecture in morning fog, warm tones, natural light, 50mm lens\n' +
    'Negative prompt: blurry, deformed, lowres, text, watermark, logo\n' +
    'Steps: 30, Sampler: DPM++ 2M Karras, CFG scale: 6.5, Seed: 92837410, Size: 120x90, Model hash: d9e02c5f11, Model: SDXL_v1.0_Editorial';

  const compressedParams = zlibSync(Buffer.from(paramText, 'latin1'));
  const ztxtPayload = Buffer.concat([
    Buffer.from('parameters\0\0', 'latin1'), // keyword + null + compression method 0
    Buffer.from(compressedParams),
  ]);

  // tEXt Software chunk
  const textSoftware = Buffer.from('Software\0Automatic1111 WebUI v1.10.0', 'latin1');

  // IDAT with scanlines
  const rawRows: Buffer[] = [];
  for (let y = 0; y < 90; y++) {
    const row = Buffer.alloc(1 + 120 * 3);
    row[0] = 0;
    for (let x = 0; x < 120; x++) {
      row[1 + x * 3] = 66;
      row[1 + x * 3 + 1] = 107;
      row[1 + x * 3 + 2] = 84;
    }
    rawRows.push(row);
  }
  const compressedIdat = zlibSync(Buffer.concat(rawRows));

  const png = Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('zTXt', ztxtPayload),
    makeChunk('tEXt', textSoftware),
    makeChunk('IDAT', compressedIdat),
    makeChunk('IEND', new Uint8Array(0)),
  ]);

  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
}

export function createComfyUiPngFixture(): ArrayBuffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function makeChunk(type: string, data: Uint8Array): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    let c = 0xffffffff;
    const combined = Buffer.concat([typeBuf, Buffer.from(data)]);
    for (let i = 0; i < combined.length; i++) {
      c = (c >>> 8) ^ CRC_TABLE[(c ^ combined[i]) & 0xff];
    }
    crc.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0);
    return Buffer.concat([len, typeBuf, Buffer.from(data), crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(100, 0);
  ihdr.writeUInt32BE(100, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const comfyPrompt = JSON.stringify({
    3: { class_type: 'KSampler', inputs: { seed: 44291823, steps: 25, cfg: 7.0, sampler_name: 'euler' } },
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'v1-5-pruned-emaonly.safetensors' } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: 'A clean studio interior photograph with morning sunlight' } },
  });

  // iTXt uncompressed chunk for 'prompt'
  const itxtPayload = Buffer.concat([
    Buffer.from('prompt\0\0\0\0\0', 'latin1'), // keyword + null + compFlag 0 + compMethod 0 + lang null + trans null
    Buffer.from(comfyPrompt, 'utf8'),
  ]);

  const rawRows: Buffer[] = [];
  for (let y = 0; y < 100; y++) {
    const row = Buffer.alloc(1 + 100 * 3);
    row[0] = 0;
    rawRows.push(row);
  }
  const compressedIdat = zlibSync(Buffer.concat(rawRows));

  const png = Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('iTXt', itxtPayload),
    makeChunk('IDAT', compressedIdat),
    makeChunk('IEND', new Uint8Array(0)),
  ]);

  return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
}

// CRC Table for chunk builder
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();
