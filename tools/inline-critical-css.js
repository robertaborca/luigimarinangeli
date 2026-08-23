const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CORE_CSS = fs.readFileSync(path.join(__dirname, 'critical-core.css'), 'utf8');
const LANDING_NAV_CSS = fs.readFileSync(path.join(__dirname, 'critical-landing-nav.css'), 'utf8');

const files = [
  ...['index.html', 'grazie.html', 'privacy-cookie-policy.html'].map(f => ({ file: f, group: 'A' })),
  ...fs.readdirSync(path.join(ROOT, 'BLOG')).filter(f => f.endsWith('.html')).map(f => ({ file: `BLOG/${f}`, group: 'B' })),
  ...fs.readdirSync(path.join(ROOT, 'CASE')).filter(f => f.endsWith('.html')).map(f => ({ file: `CASE/${f}`, group: 'B' })),
  ...['vendi-casa.html', 'compra-casa.html', 'immobili.html', 'blog.html', 'consulenza.html'].map(f => ({ file: `SRC/${f}`, group: 'C' })),
];

function preloadLink(hrefAttrs) {
  // hrefAttrs: the full original <link ...> attributes string (minus rel=stylesheet)
  const hrefMatch = hrefAttrs.match(/href="([^"]+)"/);
  const href = hrefMatch[1];
  return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n        <noscript><link rel="stylesheet" href="${href}"></noscript>`;
}

let processed = 0;
for (const { file, group } of files) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, 'utf8');

  const linkRe = /<link rel="stylesheet"[^>]*>/g;
  const links = [...html.matchAll(linkRe)];
  if (links.length === 0) {
    console.log(`SKIP (no stylesheet link found): ${file}`);
    continue;
  }

  const critical = group === 'C' ? (CORE_CSS + LANDING_NAV_CSS) : CORE_CSS;
  const criticalBlock = `<style id="critical-css">${critical}</style>\n        `;

  // Insert critical style block before the first stylesheet link, replace all stylesheet links with preload pattern
  let firstDone = false;
  html = html.replace(linkRe, (match) => {
    const replacement = preloadLink(match);
    if (!firstDone) {
      firstDone = true;
      return criticalBlock + replacement;
    }
    return replacement;
  });

  fs.writeFileSync(filePath, html);
  processed++;
  console.log(`OK (${group}, ${links.length} link(s)): ${file}`);
}

console.log(`\nProcessed ${processed}/${files.length} files.`);
