import fs from 'fs';
import path from 'path';
const root = process.cwd();
const SITEMAP = 'sitemapMAR.xml';
const BASE = 'https://www.lecasediluigi.com';

const xml = fs.readFileSync(SITEMAP, 'utf8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// pagine HTML reali e loro stato robots
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const pages = new Map(); // url path -> {noindex}
for (const f of walk(root)) {
  const rel = path.relative(root, f).split(path.sep).join('/');
  const html = fs.readFileSync(f, 'utf8');
  const noindex = /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  pages.set(rel === 'index.html' ? '/' : '/' + rel, { noindex, file: rel });
}

// path che vengono rediretti (sorgenti delle RewriteRule)
// Solo le regole incondizionate: la catch-all di canonicalizzazione host
// è preceduta da RewriteCond e non redirige un URL già canonico.
const ht = fs.readFileSync('.htaccess', 'utf8').split(/\r?\n/);
const redirectSources = [];
for (let i = 0; i < ht.length; i++) {
  const m = ht[i].match(/^RewriteRule\s+\^(\S+?)\$\s/);
  if (!m) continue;
  let j = i - 1, condizionata = false;
  while (j >= 0 && ht[j].trim() !== '') {
    if (/^RewriteCond\s/.test(ht[j].trim())) { condizionata = true; break; }
    if (/^RewriteRule\s/.test(ht[j].trim())) break;
    j--;
  }
  if (!condizionata) redirectSources.push(m[1]);
}

const problemi = [];
console.log('=== URL NELLA SITEMAP (' + locs.length + ') ===');
for (const loc of locs) {
  const issues = [];
  if (!loc.startsWith(BASE + '/')) issues.push('non canonico (atteso ' + BASE + ')');
  const p = loc.slice(BASE.length) || '/';
  const page = pages.get(p);
  if (!page) issues.push('FILE INESISTENTE');
  else if (page.noindex) issues.push('pagina NOINDEX');
  const relNoSlash = p.replace(/^\//, '');
  for (const src of redirectSources) {
    try { if (new RegExp('^' + src + '$').test(relNoSlash)) issues.push('sorgente di un 301: ' + src); } catch {}
  }
  if (issues.length) problemi.push(loc + ' -> ' + issues.join('; '));
  console.log((issues.length ? 'KO  ' : 'ok  ') + p + (issues.length ? '   [' + issues.join('; ') + ']' : ''));
}

console.log('\n=== PAGINE INDICIZZABILI NON IN SITEMAP ===');
const inSitemap = new Set(locs.map((l) => l.slice(BASE.length) || '/'));
let mancanti = 0;
for (const [p, info] of pages) {
  if (info.noindex) continue;
  if (!inSitemap.has(p)) { console.log('MANCA  ' + p); mancanti++; }
}
if (!mancanti) console.log('(nessuna: copertura completa)');

console.log('\n=== PAGINE NOINDEX (escluse correttamente) ===');
for (const [p, info] of pages) if (info.noindex) console.log('  ' + p + (inSitemap.has(p) ? '  <-- PRESENTE IN SITEMAP, da rimuovere' : '  (fuori sitemap, ok)'));

console.log('\n' + (problemi.length ? problemi.length + ' problemi' : 'Sitemap coerente: nessun problema'));
