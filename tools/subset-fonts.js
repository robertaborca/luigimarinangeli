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
  // italianno.woff2 e cormorant-garamond-500*.woff2 non si riducono: sono già
  // il set latino di Google Fonts, e ridurli al solo testo dell'hero fa cadere
  // le lettere nel font di riserva appena il testo cambia.
}

run();
