const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const files = [
  'SRC/immobili.html',
  'index.html',
  ...fs.readdirSync(path.join(ROOT, 'CASE')).filter(f => f.endsWith('.html')).map(f => `CASE/${f}`),
];

let totalUpdated = 0;

for (const rel of files) {
  const filePath = path.join(ROOT, rel);
  let html = fs.readFileSync(filePath, 'utf8');
  const dirOfFile = path.dirname(filePath);
  let fileUpdated = 0;

  html = html.replace(/srcset="([^"]*)"/g, (full, srcsetValue) => {
    // find the 400w entry to derive the base path + extension
    const entries = srcsetValue.split(',').map(s => s.trim());
    const m400 = entries.find(e => / 400w$/.test(e));
    if (!m400) return full; // not one of our generated srcsets
    if (entries.some(e => / 600w$/.test(e))) return full; // already has 600w

    const relSrc400 = m400.replace(/\s+400w$/, '');
    const relSrc600 = relSrc400.replace(/-400(\.\w+)$/, '-600$1');
    if (relSrc600 === relSrc400) return full; // regex didn't match, skip safely

    const abs600 = path.resolve(dirOfFile, relSrc600);
    if (!fs.existsSync(abs600)) return full; // no 600w variant generated for this image (too small originally)

    // insert right after the 400w entry
    const idx400 = entries.indexOf(m400);
    entries.splice(idx400 + 1, 0, `${relSrc600} 600w`);
    fileUpdated++;
    return `srcset="${entries.join(',\n                  ')}"`;
  });

  if (fileUpdated > 0) {
    fs.writeFileSync(filePath, html);
    console.log(`${rel}: added 600w to ${fileUpdated} srcset(s)`);
    totalUpdated += fileUpdated;
  }
}

console.log(`\nTotal srcset attributes updated: ${totalUpdated}`);
