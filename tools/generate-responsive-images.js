const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const WIDTHS = [400, 800, 1200];
const QUALITY = 74;

function collectImagePaths() {
  const paths = new Set();

  const immobili = fs.readFileSync(path.join(ROOT, 'SRC/immobili.html'), 'utf8');
  for (const m of immobili.matchAll(/<img class="property-image--landing" src="\.\.\/(IMG\/[^"]+\.webp)"/g)) {
    paths.add(m[1]);
  }

  const caseDir = path.join(ROOT, 'CASE');
  for (const file of fs.readdirSync(caseDir)) {
    if (!file.endsWith('.html')) continue;
    const html = fs.readFileSync(path.join(caseDir, file), 'utf8');
    for (const m of html.matchAll(/<div class="property-gallery__cell">\s*<img[^>]*?\ssrc="\.\.\/(IMG\/[^"]+\.webp)"/g)) {
      paths.add(m[1]);
    }
  }

  return [...paths];
}

async function run() {
  const images = collectImagePaths();
  console.log(`Found ${images.length} unique source images.`);

  let generated = 0, skipped = 0, failed = 0;

  for (const rel of images) {
    const srcPath = path.join(ROOT, rel);
    if (!fs.existsSync(srcPath)) {
      console.error(`MISSING SOURCE: ${rel}`);
      failed++;
      continue;
    }
    const ext = path.extname(rel);
    const base = rel.slice(0, -ext.length);
    const buffer = fs.readFileSync(srcPath);
    const meta = await sharp(buffer).metadata();

    for (const w of WIDTHS) {
      const outRel = `${base}-${w}${ext}`;
      const outPath = path.join(ROOT, outRel);
      if (fs.existsSync(outPath)) { skipped++; continue; }
      if (meta.width && meta.width <= w) { skipped++; continue; } // don't upscale
      try {
        await sharp(buffer)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(outPath);
        generated++;
      } catch (e) {
        console.error(`FAILED: ${outRel} - ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`Done. Generated: ${generated}, skipped (existing/too-small): ${skipped}, failed: ${failed}`);
}

run();
