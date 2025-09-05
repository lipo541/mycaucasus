import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC_DIR = path.join(process.cwd(), 'public', 'assets', 'hero');
const OUT_DIR = SRC_DIR; // overwrite side-by-side with webp variants

const targets = [
  { file: 'tandem.jpg', base: 'tandem' },
  { file: 'training.jpg', base: 'training' },
  { file: 'community.jpg', base: 'community' },
];

const sizes = [
  { suffix: '320', width: 320 }, // thumbnails / small devices
  { suffix: '960', width: 960 },
  { suffix: '1600', width: 1600 },
  { suffix: '1920', width: 1920 },
];

async function convert() {
  for (const t of targets) {
    const input = path.join(SRC_DIR, t.file);
    if (!fs.existsSync(input)) {
      console.warn('[skip] missing', input);
      continue;
    }
    const buf = fs.readFileSync(input);
    for (const s of sizes) {
      const pipeline = sharp(buf).resize({ width: s.width, withoutEnlargement: true });
      const webpOut = path.join(OUT_DIR, `${t.base}-${s.suffix}.webp`);
      await pipeline.webp({ quality: 76 }).toFile(webpOut);
      console.log('✔ webp', webpOut);
      const jpgOut = path.join(OUT_DIR, `${t.base}-${s.suffix}.jpg`);
      await pipeline.jpeg({ quality: 78, mozjpeg: true }).toFile(jpgOut);
      console.log('✔ jpg', jpgOut);
    }
  }
  console.log('Done.');
}

convert().catch(e => { console.error(e); process.exit(1); });