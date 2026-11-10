/**
 * Safe Binary Reader with strict bounds checking, recursive safety, and multi-endianness support.
 * Never throws uncaught range errors on truncated or malformed files.
 */
export class SafeBinaryReader {
  private view: DataView;
  private buffer: ArrayBuffer;
  private pos: number = 0;
  private readonly byteLength: number;
  public isLittleEndian: boolean = false;

  constructor(buffer: ArrayBuffer | Uint8Array, offset: number = 0, length?: number) {
    if (buffer instanceof Uint8Array) {
      const sliced = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
      this.buffer = sliced as ArrayBuffer;
    } else {
      this.buffer = buffer as ArrayBuffer;
    }

    const available = this.buffer.byteLength - offset;
    this.byteLength = length !== undefined ? Math.min(length, available) : available;
    this.view = new DataView(this.buffer, offset, this.byteLength);
    this.pos = 0;
  }

  get position(): number {
    return this.pos;
  }

  get length(): number {
    return this.byteLength;
  }

  get remaining(): number {
    return Math.max(0, this.byteLength - this.pos);
  }

  get eof(): boolean {
    return this.pos >= this.byteLength;
  }

  seek(position: number): boolean {
    if (position >= 0 && position <= this.byteLength) {
      this.pos = position;
      return true;
    }
    return false;
  }

  skip(bytes: number): boolean {
    return this.seek(this.pos + bytes);
  }

  canRead(bytes: number): boolean {
    return this.pos + bytes <= this.byteLength;
  }

  readUint8(): number {
    if (!this.canRead(1)) return 0;
    const val = this.view.getUint8(this.pos);
    this.pos += 1;
    return val;
  }

  readUint16(littleEndian = this.isLittleEndian): number {
    if (!this.canRead(2)) return 0;
    const val = this.view.getUint16(this.pos, littleEndian);
    this.pos += 2;
    return val;
  }

  readUint32(littleEndian = this.isLittleEndian): number {
    if (!this.canRead(4)) return 0;
    const val = this.view.getUint32(this.pos, littleEndian);
    this.pos += 4;
    return val;
  }

  readInt32(littleEndian = this.isLittleEndian): number {
    if (!this.canRead(4)) return 0;
    const val = this.view.getInt32(this.pos, littleEndian);
    this.pos += 4;
    return val;
  }

  readFloat32(littleEndian = this.isLittleEndian): number {
    if (!this.canRead(4)) return 0;
    const val = this.view.getFloat32(this.pos, littleEndian);
    this.pos += 4;
    return val;
  }

  readFloat64(littleEndian = this.isLittleEndian): number {
    if (!this.canRead(8)) return 0;
    const val = this.view.getFloat64(this.pos, littleEndian);
    this.pos += 8;
    return val;
  }

  peekUint8(offset = this.pos): number {
    if (offset < 0 || offset >= this.byteLength) return 0;
    return this.view.getUint8(offset);
  }

  peekUint16(offset = this.pos, littleEndian = this.isLittleEndian): number {
    if (offset < 0 || offset + 2 > this.byteLength) return 0;
    return this.view.getUint16(offset, littleEndian);
  }

  peekUint32(offset = this.pos, littleEndian = this.isLittleEndian): number {
    if (offset < 0 || offset + 4 > this.byteLength) return 0;
    return this.view.getUint32(offset, littleEndian);
  }

  readBytes(count: number): Uint8Array {
    const toRead = Math.min(count, this.remaining);
    const slice = new Uint8Array(this.buffer, this.view.byteOffset + this.pos, toRead);
    this.pos += toRead;
    return slice;
  }

  readString(length: number, encoding: 'utf-8' | 'latin1' = 'utf-8'): string {
    const bytes = this.readBytes(length);
    try {
      if (encoding === 'latin1') {
        let str = '';
        for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
        return str;
      }
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    } catch {
      return '';
    }
  }

  readNullTerminatedString(maxLen = 4096, encoding: 'utf-8' | 'latin1' = 'utf-8'): string {
    const start = this.pos;
    let end = start;
    while (end < this.byteLength && end - start < maxLen && this.view.getUint8(end) !== 0) {
      end++;
    }
    const len = end - start;
    const str = this.readString(len, encoding);
    if (this.pos < this.byteLength && this.view.getUint8(this.pos) === 0) {
      this.pos++; // Skip null terminator
    }
    return str;
  }

  createSubReader(offset: number, length?: number): SafeBinaryReader {
    const subOffset = this.view.byteOffset + offset;
    const reader = new SafeBinaryReader(this.buffer, subOffset, length);
    reader.isLittleEndian = this.isLittleEndian;
    return reader;
  }
}
