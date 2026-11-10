import fs from 'fs';
import path from 'path';

// Generate a valid PNG with metadata chunks (tEXt and c2pa simulation)
function createSamplePng() {
  const width = 400;
  const height = 300;

  // Minimal valid 1x1 or small PNG buffer generator with chunks
  // We can construct a valid PNG:
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    // Simple CRC32
    const crc = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crc.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  // Table for CRC32
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(200, 0); // width
  ihdr.writeUInt32BE(150, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Metadata chunks (tEXt)
  const metaChunks = [
    makeChunk('tEXt', Buffer.from('Software\0DALL·E 3 / OpenAI Generator', 'utf8')),
    makeChunk('tEXt', Buffer.from('Artist\0AI Synthetic Model v4', 'utf8')),
    makeChunk('tEXt', Buffer.from('Description\0Warm light editorial architectural study', 'utf8')),
    makeChunk('tEXt', Buffer.from('Copyright\0Generated with C2PA Content Credentials', 'utf8')),
    makeChunk('c2pa', Buffer.from('JUMBF_MANIFEST_C2PA_SIGNED_PROVENANCE_HASH_TEST_V2', 'utf8')),
  ];

  // Raw image data: 150 scanlines, each starting with filter byte 0x00, followed by 200*3 RGB bytes (warm sage green #426B54)
  import('zlib').then((zlib) => {
    const rawRows = [];
    for (let y = 0; y < 150; y++) {
      const row = Buffer.alloc(1 + 200 * 3);
      row[0] = 0; // Filter None
      for (let x = 0; x < 200; x++) {
        // Gradient warm green to cream
        const r = Math.min(255, 66 + Math.floor(x * 0.4));
        const g = Math.min(255, 107 + Math.floor(y * 0.3));
        const b = Math.min(255, 84 + Math.floor((x + y) * 0.2));
        row[1 + x * 3] = r;
        row[1 + x * 3 + 1] = g;
        row[1 + x * 3 + 2] = b;
      }
      rawRows.push(row);
    }
    const uncompressed = Buffer.concat(rawRows);
    const compressed = zlib.deflateSync(uncompressed);
    const idatChunk = makeChunk('IDAT', compressed);
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    const png = Buffer.concat([signature, ihdrChunk, ...metaChunks, idatChunk, iendChunk]);
    fs.writeFileSync('public/samples/chatgpt-c2pa.png', png);
    console.log('Created chatgpt-c2pa.png');
  });
}

// Generate valid JPEG with EXIF APP1 Segment
function createSampleJpeg() {
  import('zlib').then(() => {
    // We create a sample JPEG by wrapping a valid baseline JPEG and inserting an APP1 Exif segment
    // Let's create an APP1 segment:
    const exifHeader = Buffer.from('Exif\0\0', 'ascii');
    // TIFF header: "II" (little endian), 42 (0x002A), offset 8
    const tiffHeader = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]);

    // IFD0 entries
    const numEntries = 7;
    const ifd0 = Buffer.alloc(2 + numEntries * 12 + 4);
    ifd0.writeUInt16LE(numEntries, 0);

    let offset = 2;
    function writeTag(tag, type, count, valOrOffset) {
      ifd0.writeUInt16LE(tag, offset);
      ifd0.writeUInt16LE(type, offset + 2);
      ifd0.writeUInt32LE(count, offset + 4);
      ifd0.writeUInt32LE(valOrOffset, offset + 8);
      offset += 12;
    }

    // Values stored past IFD0
    const valStart = 8 + 2 + numEntries * 12 + 4;
    const makeStr = Buffer.from('Leica Camera AG\0', 'ascii');
    const modelStr = Buffer.from('Leica Q3 (Typ 6506)\0', 'ascii');
    const artistStr = Buffer.from('Editorial Photographer\0', 'ascii');
    const dateStr = Buffer.from('2026:10:14 16:45:22\0', 'ascii');
    const lensStr = Buffer.from('Summilux 28mm f/1.7 ASPH\0', 'ascii');

    let currentValOffset = valStart;
    writeTag(0x010f, 2, makeStr.length, currentValOffset); // Make
    currentValOffset += makeStr.length;

    writeTag(0x0110, 2, modelStr.length, currentValOffset); // Model
    currentValOffset += modelStr.length;

    writeTag(0x013b, 2, artistStr.length, currentValOffset); // Artist
    currentValOffset += artistStr.length;

    writeTag(0x9003, 2, dateStr.length, currentValOffset); // DateTimeOriginal
    currentValOffset += dateStr.length;

    writeTag(0xa434, 2, lensStr.length, currentValOffset); // LensModel
    currentValOffset += lensStr.length;

    writeTag(0x0001, 2, 2, 0x4e); // GPSLatitudeRef 'N'
    writeTag(0x0003, 2, 2, 0x45); // GPSLongitudeRef 'E'

    ifd0.writeUInt32LE(0, offset); // Next IFD offset = 0

    const tiffBody = Buffer.concat([
      tiffHeader,
      ifd0,
      makeStr,
      modelStr,
      artistStr,
      dateStr,
      lensStr,
    ]);

    const app1Len = 2 + exifHeader.length + tiffBody.length;
    const app1LenBuf = Buffer.alloc(2);
    app1LenBuf.writeUInt16BE(app1Len, 0);

    const app1Segment = Buffer.concat([
      Buffer.from([0xff, 0xe1]),
      app1LenBuf,
      exifHeader,
      tiffBody,
    ]);

    // Minimal valid JPEG stream (16x16 pixels)
    // SOI
    const soi = Buffer.from([0xff, 0xd8]);
    // DQT (Quantization table)
    const dqt = Buffer.from([
      0xff, 0xdb, 0x00, 0x43, 0x00,
      0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14,
      0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a,
      0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c,
      0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32
    ]);
    // SOF0 (Start of Frame: 100x80, 1 component grayscale or 3 component YCbCr)
    const sof0 = Buffer.from([
      0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x50, 0x00, 0x64, 0x01, 0x01, 0x11, 0x00
    ]);
    // DHT (Huffman table)
    const dht = Buffer.from([
      0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b
    ]);
    // SOS (Start of Scan)
    const sos = Buffer.from([
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00
    ]);
    // Dummy scan data and EOI
    const scanData = Buffer.from([
      0xfd, 0xfc, 0xa0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    const eoi = Buffer.from([0xff, 0xd9]);

    const jpeg = Buffer.concat([soi, app1Segment, dqt, sof0, dht, sos, scanData, eoi]);
    fs.writeFileSync('public/samples/leica-paris-gps.jpg', jpeg);
    console.log('Created leica-paris-gps.jpg');
  });
}

// Generate valid SVG sample
function createSampleSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <!-- Metadata: Creator="PixelCraft Studio" Copyright="Editorial 2026" -->
  <rect width="600" height="400" fill="#F8F9F8"/>
  <circle cx="300" cy="200" r="120" fill="#EAF2EC" stroke="#426B54" stroke-width="2"/>
  <circle cx="300" cy="200" r="40" fill="#426B54"/>
  <path d="M220 200 Q 300 120 380 200 T 540 200" fill="none" stroke="#777F79" stroke-width="1.5" stroke-dasharray="4 4"/>
  <text x="300" y="360" text-anchor="middle" font-family="DM Serif Display, Georgia, serif" font-size="24" fill="#202522">
    Editorial Architectural Composition
  </text>
</svg>`;
  fs.writeFileSync('public/samples/editorial-composition.svg', svg);
  console.log('Created editorial-composition.svg');
}

createSamplePng();
createSampleJpeg();
createSampleSvg();

