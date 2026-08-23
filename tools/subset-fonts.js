const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font');

const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'CSS/fonts');

// Latin text subset: ASCII printable + Italian accented letters + common typography/currency.
// Excludes emoji (browser falls back to system emoji font regardless) and zero-width marks.
const LATIN_TEXT =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
  '°²·ÀÈàèéìòù' +
  '–—‘’…›€';

const HERO_TEXT = 'Il mio lavoro, la mia passione.';

async function subsetOne(relPath, text, label, variationAxes) {
  const srcPath = path.join(FONTS_DIR, relPath);
  const before = fs.statSync(srcPath).size;
  const buffer = fs.readFileSync(srcPath);
  const opts = { targetFormat: 'woff2' };
  if (variationAxes) opts.variationAxes = variationAxes;
  const result = await subsetFont(buffer, text, opts);
  fs.writeFileSync(srcPath, result);
  const after = result.length;
  console.log(`${label}: ${before} -> ${after} bytes (${Math.round((1 - after / before) * 100)}% smaller)`);
}

async function run() {
  // Actual usage only spans font-weight 100-700 (see grep of CSS), narrow the variable axis from 100-900.
  const wghtRange = { wght: { min: 100, max: 700 } };
  await subsetOne('montserrat.woff2', LATIN_TEXT, 'montserrat.woff2', wghtRange);
  await subsetOne('montserrat-italic.woff2', LATIN_TEXT, 'montserrat-italic.woff2', wghtRange);
  await subsetOne('suse.woff2', LATIN_TEXT, 'suse.woff2', wghtRange);
  await subsetOne('great-vibes.woff2', HERO_TEXT, 'great-vibes.woff2');
}

run();
