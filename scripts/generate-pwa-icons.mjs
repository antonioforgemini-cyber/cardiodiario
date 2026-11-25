import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const OUT_DIR = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

// CRC32 table for PNG chunk checksums
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type None
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", idatData),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const lenSq = bax * bax + bay * bay;
  const h = lenSq > 0 ? clamp01((pax * bax + pay * bay) / lenSq) : 0;
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.hypot(dx, dy);
}

function sdRoundedBox(px, py, cx, cy, halfW, halfH, r) {
  const dx = Math.abs(px - cx) - halfW + r;
  const dy = Math.abs(py - cy) - halfH + r;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
}

function compositeOver(dst, idx, r, g, b, a) {
  if (a <= 0) return;
  const srcA = clamp01(a);
  const dstA = dst[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  const dstR = dst[idx] / 255;
  const dstG = dst[idx + 1] / 255;
  const dstB = dst[idx + 2] / 255;
  const outR = ((r / 255) * srcA + dstR * dstA * (1 - srcA)) / outA;
  const outG = ((g / 255) * srcA + dstG * dstA * (1 - srcA)) / outA;
  const outB = ((b / 255) * srcA + dstB * dstA * (1 - srcA)) / outA;
  dst[idx] = Math.round(clamp01(outR) * 255);
  dst[idx + 1] = Math.round(clamp01(outG) * 255);
  dst[idx + 2] = Math.round(clamp01(outB) * 255);
  dst[idx + 3] = Math.round(clamp01(outA) * 255);
}

const ECG_POINTS = [
  [12, 25],
  [17, 25],
  [20, 18],
  [25, 32],
  [29, 22],
  [32, 27],
  [36, 27],
];

function renderCardioIcon(size, { roundedBg, opaqueBg, scale, monochromeBadge }) {
  const rgba = Buffer.alloc(size * size * 4);
  const pxToView = 48 / size;
  const aa = pxToView * 0.9;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const vx = ((x + 0.5) / size) * 48;
      const vy = ((y + 0.5) / size) * 48;

      if (opaqueBg) {
        compositeOver(rgba, idx, 74, 124, 89, 1);
      } else if (roundedBg) {
        const bgDist = sdRoundedBox(vx, vy, 24, 24, 24, 24, 12);
        const bgAlpha = clamp01(0.5 - bgDist / aa);
        compositeOver(rgba, idx, 74, 124, 89, bgAlpha);
      }

      // Map view coords into scaled artwork space around center (24, 24)
      const ax = (vx - 24) / scale + 24;
      const ay = (vy - 24) / scale + 24;
      const strokeRadius = monochromeBadge ? 2.1 : 1.5;

      let minSegDist = Infinity;
      for (let i = 0; i < ECG_POINTS.length - 1; i++) {
        const [x1, y1] = ECG_POINTS[i];
        const [x2, y2] = ECG_POINTS[i + 1];
        const d = distToSegment(ax, ay, x1, y1, x2, y2);
        if (d < minSegDist) minSegDist = d;
      }

      const lineAlpha = clamp01(0.5 - (minSegDist - strokeRadius) / (aa / scale));
      compositeOver(rgba, idx, 255, 255, 255, lineAlpha);

      // Accent dot
      const dotDist = Math.hypot(ax - 36, ay - 18) - (monochromeBadge ? 3.0 : 2.5);
      const dotAlpha = clamp01(0.5 - dotDist / (aa / scale));
      if (monochromeBadge) {
        compositeOver(rgba, idx, 255, 255, 255, dotAlpha);
      } else {
        compositeOver(rgba, idx, 194, 125, 56, dotAlpha);
      }
    }
  }

  return encodePng(size, size, rgba);
}

const targets = [
  {
    name: "icon-192.png",
    size: 192,
    opts: { roundedBg: true, opaqueBg: false, scale: 1, monochromeBadge: false },
  },
  {
    name: "icon-512.png",
    size: 512,
    opts: { roundedBg: true, opaqueBg: false, scale: 1, monochromeBadge: false },
  },
  {
    name: "icon-maskable-192.png",
    size: 192,
    opts: { roundedBg: false, opaqueBg: true, scale: 0.72, monochromeBadge: false },
  },
  {
    name: "icon-maskable-512.png",
    size: 512,
    opts: { roundedBg: false, opaqueBg: true, scale: 0.72, monochromeBadge: false },
  },
  {
    name: "apple-touch-icon.png",
    size: 180,
    opts: { roundedBg: false, opaqueBg: true, scale: 0.84, monochromeBadge: false },
  },
  {
    name: "badge-72.png",
    size: 72,
    opts: { roundedBg: false, opaqueBg: false, scale: 1.18, monochromeBadge: true },
  },
];

for (const t of targets) {
  const outPath = path.join(OUT_DIR, t.name);
  const png = renderCardioIcon(t.size, t.opts);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${t.name} (${t.size}x${t.size}, ${png.length} bytes)`);
}
