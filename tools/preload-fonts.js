const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const files = [
  { file: 'index.html', prefix: '', hero: true },
  { file: 'grazie.html', prefix: '', hero: false },
  { file: 'privacy-cookie-policy.html', prefix: '', hero: false },
  ...fs.readdirSync(path.join(ROOT, 'BLOG')).filter(f => f.endsWith('.html')).map(f => ({ file: `BLOG/${f}`, prefix: '../', hero: false })),
  ...fs.readdirSync(path.join(ROOT, 'CASE')).filter(f => f.endsWith('.html')).map(f => ({ file: `CASE/${f}`, prefix: '../', hero: false })),
  ...['vendi-casa.html', 'compra-casa.html', 'immobili.html', 'blog.html', 'consulenza.html'].map(f => ({ file: `SRC/${f}`, prefix: '../', hero: false })),
];

let processed = 0;
for (const { file, prefix, hero } of files) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('as="font"')) {
    console.log(`SKIP (already has font preload): ${file}`);
    continue;
  }

  const fontsBase = `${prefix}CSS/fonts/`;
  let preloads =
    `<link rel="preload" href="${fontsBase}montserrat.woff2" as="font" type="font/woff2" crossorigin>\n` +
    `        <link rel="preload" href="${fontsBase}suse.woff2" as="font" type="font/woff2" crossorigin>\n`;
  if (hero) {
    preloads += `        <link rel="preload" href="${fontsBase}great-vibes.woff2" as="font" type="font/woff2" crossorigin>\n`;
  }
  preloads += '        ';

  const marker = '<style id="critical-css">';
  if (!html.includes(marker)) {
    console.log(`SKIP (no critical-css marker found): ${file}`);
    continue;
  }
  html = html.replace(marker, preloads + marker);

  fs.writeFileSync(filePath, html);
  processed++;
  console.log(`OK: ${file}`);
}

console.log(`\nProcessed ${processed}/${files.length} files.`);
