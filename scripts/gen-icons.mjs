#!/usr/bin/env node
/**
 * Draws the Dogear app icons.
 *
 * Written as a generator rather than checked-in binaries so the mark stays in sync with the
 * brand: change the palette here and every icon, the splash and the favicon regenerate
 * identically. PNGs are encoded by hand (deflate + CRC) to avoid pulling an image library
 * into the toolchain for four files.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const INK = [0x1c, 0x1b, 0x29];
const PAPER = [0xff, 0xfc, 0xf5];
const MARIGOLD = [0xff, 0xb6, 0x27];

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** rgba: Uint8Array of width*height*4 */
const encodePng = (rgba, width, height) => {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

/**
 * Returns the colour at a normalised point, or null for transparent.
 * `scale` shrinks the mark within the canvas so adaptive icons keep their safe zone.
 */
const sample = (x, y, { background, scale }) => {
  // Map into the mark's own 0..1 space.
  const c = 0.5;
  const mx = (x - c) / scale + c;
  const my = (y - c) / scale + c;

  const L = 0.2, R = 0.8, T = 0.155, B = 0.845, f = 0.215, r = 0.055;

  const insideRect = mx >= L && mx <= R && my >= T && my <= B;
  // The cut corner: everything above the fold diagonal is not page.
  const belowFoldLine = my >= mx - R + f + T;

  // Round the three un-folded corners.
  const rounded = (cx, cy) => (mx - cx) ** 2 + (my - cy) ** 2 <= r * r;
  const inCornerBox = (cx, cy) =>
    Math.abs(mx - cx) < r && Math.abs(my - cy) < r && ((mx < cx) === (cx === L + r)) === ((my < cy) === (cy === T + r));
  let cornerOk = true;
  for (const [cx, cy] of [[L + r, T + r], [L + r, B - r], [R - r, B - r]]) {
    const nearX = Math.abs(mx - cx) < r && (cx === L + r ? mx < cx : mx > cx);
    const nearY = Math.abs(my - cy) < r && (cy === T + r ? my < cy : my > cy);
    if (nearX && nearY && !rounded(cx, cy)) cornerOk = false;
  }
  void inCornerBox;

  if (insideRect && belowFoldLine && cornerOk) {
    // The folded flap sits in the square the cut left behind.
    const inFlapSquare = mx >= R - f && my <= T + f;
    if (inFlapSquare) return MARIGOLD;

    // Three lines of text on the page.
    const lines = [0.45, 0.585, 0.72];
    for (let i = 0; i < lines.length; i++) {
      const ly = lines[i];
      const right = i === 2 ? 0.56 : 0.695;
      if (Math.abs(my - ly) <= 0.032 && mx >= 0.305 && mx <= right) return INK;
    }
    return PAPER;
  }
  return background;
};

const render = (size, { background = null, scale = 1 } = {}) => {
  const rgba = new Uint8Array(size * size * 4);
  const SS = 3; // supersampling factor — the diagonal fold needs it
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          const c = sample(x, y, { background, scale });
          if (c) {
            r += c[0]; g += c[1]; b += c[2]; a += 255;
          }
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      // Un-premultiply so edges against transparency stay the right hue.
      rgba[i] = a ? Math.round(r / (a / 255)) : 0;
      rgba[i + 1] = a ? Math.round(g / (a / 255)) : 0;
      rgba[i + 2] = a ? Math.round(b / (a / 255)) : 0;
      rgba[i + 3] = Math.round(a / n);
    }
  }
  return encodePng(rgba, size, size);
};

mkdirSync('assets', { recursive: true });
const files = [
  ['assets/icon.png', render(1024, { background: INK, scale: 0.78 })],
  ['assets/adaptive-icon.png', render(1024, { background: null, scale: 0.62 })],
  ['assets/splash.png', render(512, { background: null, scale: 0.9 })],
  ['assets/favicon.png', render(64, { background: INK, scale: 0.82 })],
];
for (const [path, buf] of files) {
  writeFileSync(path, buf);
  console.log(`${path.padEnd(28)} ${(buf.length / 1024).toFixed(1)} KB`);
}
