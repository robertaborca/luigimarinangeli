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

// Real @font-face declarations, taken verbatim from CSS/style.css (whose url()s
// are relative to /CSS/). Inlined in an HTML document they resolve relative to
// that document instead, so the fonts/ prefix must be rewritten per directory
// depth: root-level pages (group A) need "CSS/fonts/", one-level-deep pages
// (groups B and C) need "../CSS/fonts/".
function fontFaceBlock(fontsPrefix) {
  return `@font-face{font-family:Montserrat;font-style:normal;font-weight:100 900;font-display:swap;src:url(${fontsPrefix}montserrat.woff2) format('woff2')}@font-face{font-family:Montserrat;font-style:italic;font-weight:100 900;font-display:swap;src:url(${fontsPrefix}montserrat-italic.woff2) format('woff2')}@font-face{font-family:SUSE;font-style:normal;font-weight:100 800;font-display:swap;src:url(${fontsPrefix}suse.woff2) format('woff2')}@font-face{font-family:'Great Vibes';font-style:normal;font-weight:400;font-display:swap;src:url(${fontsPrefix}great-vibes.woff2) format('woff2')}`;
}

function criticalCssFor(group) {
  const fontsPrefix = group === 'A' ? 'CSS/fonts/' : '../CSS/fonts/';
  const rest = group === 'C' ? (CORE_CSS + LANDING_NAV_CSS) : CORE_CSS;
  return fontFaceBlock(fontsPrefix) + rest;
}

function preloadLink(href) {
  return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">\n        <noscript><link rel="stylesheet" href="${href}"></noscript>`;
}

// Running this script twice used to corrupt the output: the second pass would
// match the <link rel="stylesheet"> left inside the first pass's <noscript>
// and re-run the insertion logic on it, nesting a second <style id="critical-css">
// and a second <noscript> inside the first. This pattern collapses any such
// corrupted block (for a given href, with or without the extra nested style
// tag) back into a single clean preload+noscript pair, making the script
// idempotent.
const CORRUPT_RE = /<link rel="preload" href="([^"]+)" as="style" onload="this\.onload=null;this\.rel='stylesheet'">\s*<noscript>(?:<style id="critical-css">[\s\S]*?<\/style>\s*)?<link rel="preload" href="\1" as="style" onload="this\.onload=null;this\.rel='stylesheet'">\s*<noscript><link rel="stylesheet" href="\1"><\/noscript><\/noscript>/g;

let processed = 0;
for (const { file, group } of files) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, 'utf8');
  const criticalCss = criticalCssFor(group);

  if (html.includes('id="critical-css"')) {
    // Already processed at least once: repair any corrupted duplicate blocks,
    // then refresh the (now-single) critical CSS content in place.
    html = html.replace(CORRUPT_RE, (_m, href) => preloadLink(href));
    html = html.replace(/<style id="critical-css">[\s\S]*?<\/style>/, `<style id="critical-css">${criticalCss}</style>`);
    fs.writeFileSync(filePath, html);
    processed++;
    console.log(`REFRESHED (${group}): ${file}`);
    continue;
  }

  const linkRe = /<link rel="stylesheet"[^>]*>/g;
  const links = [...html.matchAll(linkRe)];
  if (links.length === 0) {
    console.log(`SKIP (no stylesheet link found): ${file}`);
    continue;
  }

  const criticalBlock = `<style id="critical-css">${criticalCss}</style>\n        `;
  let firstDone = false;
  html = html.replace(linkRe, (match) => {
    const hrefMatch = match.match(/href="([^"]+)"/);
    const replacement = preloadLink(hrefMatch[1]);
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
