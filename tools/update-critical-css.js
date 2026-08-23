const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CORE_CSS = fs.readFileSync(path.join(__dirname, 'critical-core.css'), 'utf8');
const LANDING_NAV_CSS = fs.readFileSync(path.join(__dirname, 'critical-landing-nav.css'), 'utf8');

const groupC = new Set(['SRC/vendi-casa.html', 'SRC/compra-casa.html', 'SRC/immobili.html', 'SRC/blog.html', 'SRC/consulenza.html']);

const files = [
  'index.html', 'grazie.html', 'privacy-cookie-policy.html',
  ...fs.readdirSync(path.join(ROOT, 'BLOG')).filter(f => f.endsWith('.html')).map(f => `BLOG/${f}`),
  ...fs.readdirSync(path.join(ROOT, 'CASE')).filter(f => f.endsWith('.html')).map(f => `CASE/${f}`),
  ...groupC,
];

let updated = 0;
for (const rel of files) {
  const filePath = path.join(ROOT, rel);
  let html = fs.readFileSync(filePath, 'utf8');
  const critical = groupC.has(rel) ? (CORE_CSS + LANDING_NAV_CSS) : CORE_CSS;
  const re = /<style id="critical-css">[\s\S]*?<\/style>/;
  if (!re.test(html)) {
    console.log(`SKIP (no critical-css block found): ${rel}`);
    continue;
  }
  html = html.replace(re, `<style id="critical-css">${critical}</style>`);
  fs.writeFileSync(filePath, html);
  updated++;
}
console.log(`Updated ${updated}/${files.length} files.`);
