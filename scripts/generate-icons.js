/**
 * Generate placeholder application icons for Tauri bundler.
 * Uses only Node.js built-in modules (no dependencies required).
 * Run: node scripts/generate-icons.js
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

// CRC32 lookup table
const crcTable = new Uint32Array(256);
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
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crcBuf]);
}

function createPng(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB

  // Raw: filter byte (0) + RGB per pixel, per row
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function createIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = [];

  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry[0] = size < 256 ? size : 0;
    entry[1] = size < 256 ? size : 0;
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(24, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

// Teal placeholder — will be replaced with real branding later
const TEAL = [0, 128, 128];

const dir = "src-tauri/icons";
mkdirSync(dir, { recursive: true });

const png32 = createPng(32, ...TEAL);
const png128 = createPng(128, ...TEAL);
const png256 = createPng(256, ...TEAL);

writeFileSync(`${dir}/32x32.png`, png32);
writeFileSync(`${dir}/128x128.png`, png128);
writeFileSync(`${dir}/128x128@2x.png`, png256);

const ico = createIco([
  { size: 32, data: png32 },
  { size: 128, data: png128 },
  { size: 256, data: png256 },
]);
writeFileSync(`${dir}/icon.ico`, ico);

console.log("Placeholder icons generated in", dir);
