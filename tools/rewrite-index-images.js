const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const CARD_SIZES = '(max-width: 650px) 85vw, (max-width: 950px) 45vw, 350px';
const CONSULENZE_SIZES = '(max-width: 1020px) 80vw, 400px';

function srcsetFor(relSrc, actualWidth) {
  const ext = path.extname(relSrc);
  const base = relSrc.slice(0, -ext.length);
  const entries = [];
  for (const w of [400, 800, 1200]) {
    if (w >= actualWidth) continue;
    const variant = `${base}-${w}${ext}`;
    if (fs.existsSync(path.join(ROOT, variant))) entries.push(`${variant} ${w}w`);
  }
  entries.push(`${relSrc} ${actualWidth}w`);
  return entries.join(',\n                       ');
}

async function ensureVariants(relSrc) {
  const srcPath = path.join(ROOT, relSrc);
  const buffer = fs.readFileSync(srcPath);
  const meta = await sharp(buffer).metadata();
  const ext = path.extname(relSrc);
  const base = relSrc.slice(0, -ext.length);
  for (const w of [400, 800, 1200]) {
    if (meta.width && meta.width <= w) continue;
    const outRel = `${base}-${w}${ext}`;
    const outPath = path.join(ROOT, outRel);
    if (fs.existsSync(outPath)) continue;
    await sharp(buffer).resize({ width: w, withoutEnlargement: true }).webp({ quality: 74 }).toFile(outPath);
    console.log(`generated ${outRel}`);
  }
  return meta;
}

async function run() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');

  // 1. Property carousel card-img (11 images) — keep 330x330 attrs (object-fit:cover crop), add srcset only
  const cardRe = /<img src="(IMG\/[^"]+\.webp)" loading="lazy" alt="([^"]*)" class="card-img" height="330" width="330">/g;
  let m, cardReplacements = [];
  while ((m = cardRe.exec(html))) {
    const [full, relSrc, alt] = m;
    await ensureVariants(relSrc);
    const meta = await sharp(fs.readFileSync(path.join(ROOT, relSrc))).metadata();
    const replacement = `<img src="${relSrc}" srcset="${srcsetFor(relSrc, meta.width)}" sizes="${CARD_SIZES}" loading="lazy" decoding="async" alt="${alt}" class="card-img" height="330" width="330">`;
    cardReplacements.push([full, replacement]);
  }
  for (const [from, to] of cardReplacements) html = html.replace(from, to);
  console.log(`property carousel: rewrote ${cardReplacements.length} cards`);

  // 2. Consulenze images (3) — fix invalid height/width px-suffixed attrs, use real metadata, add srcset
  const consRe = /<img src="(IMG\/[^"]+\.webp)" loading="lazy" alt="([^"]*)" height="225px" width="465px">/g;
  let consReplacements = [];
  while ((m = consRe.exec(html))) {
    const [full, relSrc, alt] = m;
    const meta = await ensureVariants(relSrc);
    const replacement = `<img src="${relSrc}" srcset="${srcsetFor(relSrc, meta.width)}" sizes="${CONSULENZE_SIZES}" loading="lazy" decoding="async" alt="${alt}" height="${meta.height}" width="${meta.width}">`;
    consReplacements.push([full, replacement]);
  }
  for (const [from, to] of consReplacements) html = html.replace(from, to);
  console.log(`consulenze: rewrote ${consReplacements.length} images`);

  fs.writeFileSync(file, html);
}

run();
