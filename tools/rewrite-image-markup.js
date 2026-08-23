const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const GRID_SIZES = '(max-width: 768px) 92vw, (max-width: 1200px) 45vw, 373px';
const GALLERY_SIZES = '(max-width: 768px) 94vw, 650px';

function isInsideComment(html, index) {
  const lastOpen = html.lastIndexOf('<!--', index);
  const lastClose = html.lastIndexOf('-->', index);
  return lastOpen !== -1 && lastOpen > lastClose;
}

async function metaFor(relSrc) {
  const abs = path.join(ROOT, relSrc);
  const buf = fs.readFileSync(abs);
  const m = await sharp(buf).metadata();
  return { width: m.width, height: m.height };
}

function srcsetFor(relSrc, actualWidth) {
  const ext = path.extname(relSrc);
  const base = relSrc.slice(0, -ext.length);
  const entries = [];
  for (const w of [400, 800, 1200]) {
    if (w >= actualWidth) continue;
    const variant = `${base}-${w}${ext}`;
    if (fs.existsSync(path.join(ROOT, variant))) {
      entries.push(`${variant.replace(/^IMG\//, '../IMG/')} ${w}w`);
    }
  }
  entries.push(`${relSrc.replace(/^IMG\//, '../IMG/')} ${actualWidth}w`);
  return entries.join(',\n                  ');
}

async function rewriteImmobili() {
  const file = path.join(ROOT, 'SRC/immobili.html');
  let html = fs.readFileSync(file, 'utf8');
  const re = /<img class="property-image--landing" src="\.\.\/(IMG\/[^"]+\.webp)" alt="([^"]*)">/g;
  let match;
  let liveIndex = 0;
  const replacements = [];
  while ((match = re.exec(html))) {
    if (isInsideComment(html, match.index)) continue;
    const [full, relSrc, alt] = match;
    const meta = await metaFor(relSrc);
    const isFirst = liveIndex === 0;
    const srcAttr = relSrc.replace(/^IMG\//, '../IMG/');
    const priorityAttrs = isFirst
      ? `fetchpriority="high" decoding="async"`
      : `loading="lazy" decoding="async"`;
    const replacement = `<img class="property-image--landing" src="${srcAttr}" srcset="${srcsetFor(relSrc, meta.width)}" sizes="${GRID_SIZES}" width="${meta.width}" height="${meta.height}" ${priorityAttrs} alt="${alt}">`;
    replacements.push([full, replacement]);
    liveIndex++;
  }
  for (const [from, to] of replacements) html = html.replace(from, to);
  fs.writeFileSync(file, html);
  console.log(`immobili.html: rewrote ${replacements.length} cards`);
}

async function rewriteCasePages() {
  const caseDir = path.join(ROOT, 'CASE');
  for (const file of fs.readdirSync(caseDir)) {
    if (!file.endsWith('.html')) continue;
    const filePath = path.join(caseDir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    const re = /<div class="property-gallery__cell">(\s*)<img ([^>]*?)src="\.\.\/(IMG\/[^"]+\.webp)"([^>]*?)>(\s*)<\/div>/g;
    let match;
    let cellIndex = 0;
    const replacements = [];
    while ((match = re.exec(html))) {
      if (isInsideComment(html, match.index)) continue;
      const [full, ws1, beforeSrc, relSrc, afterSrc, ws2] = match;
      const altMatch = (beforeSrc + afterSrc).match(/alt="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : '';
      const meta = await metaFor(relSrc);
      const isFirst = cellIndex === 0;
      const srcAttr = relSrc.replace(/^IMG\//, '../IMG/');
      const priorityAttrs = isFirst
        ? `fetchpriority="high" decoding="async"`
        : `loading="lazy" decoding="async"`;
      const imgTag = `<img src="${srcAttr}" srcset="${srcsetFor(relSrc, meta.width)}" sizes="${GALLERY_SIZES}" width="${meta.width}" height="${meta.height}" ${priorityAttrs} alt="${alt}">`;
      const replacement = `<div class="property-gallery__cell">${ws1}${imgTag}${ws2}</div>`;
      replacements.push([full, replacement]);
      cellIndex++;
    }
    for (const [from, to] of replacements) html = html.replace(from, to);
    fs.writeFileSync(filePath, html);
    console.log(`${file}: rewrote ${replacements.length} gallery cells`);
  }
}

async function run() {
  await rewriteImmobili();
  await rewriteCasePages();
}

run();
