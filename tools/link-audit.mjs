import fs from 'fs';
import path from 'path';
const root = process.cwd();
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const toPosix = (s) => s.split(path.sep).join('/');
const files = walk(root);
const missing = {}, indexLinks = {};
const re = /(href|src|srcset|poster)\s*=\s*"([^"]+)"/gi;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = toPosix(path.relative(root, f));
  let m;
  while ((m = re.exec(html))) {
    const attr = m[1].toLowerCase();
    // srcset contiene piu' candidati "url 400w": va scomposto. Un data: URI
    // contiene una virgola sua, quindi non va spezzato (e non va controllato).
    const urls = /^\s*data:/i.test(m[2]) ? [] : attr === 'srcset'
      ? m[2].split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean)
      : [m[2].trim()];
    for (const u of urls) {
      if (!u) continue;
      if (/^(https?:|mailto:|tel:|#|data:|javascript:|whatsapp:|\/\/)/i.test(u)) continue;
      const pathPart = u.split(/[?#]/)[0];
      if (!pathPart) continue;
      let dec = pathPart;
      try { dec = decodeURIComponent(pathPart); } catch { /* percent-encoding invalido */ }
      let abs = pathPart.startsWith('/') ? path.join(root, dec) : path.join(path.dirname(f), dec);
      if (pathPart.endsWith('/')) abs = path.join(abs, 'index.html');
      if (!fs.existsSync(abs)) (missing[rel] ||= new Set()).add(attr + ': ' + u);
      if (/index\.html$/i.test(pathPart)) (indexLinks[rel] ||= []).push(u);
    }
  }
}
console.log('=== RIFERIMENTI ROTTI ===');
const keys = Object.keys(missing);
if (!keys.length) console.log('(nessuno)');
for (const f of keys) console.log(f + '\n  ' + [...missing[f]].join('\n  '));
console.log('\n=== LINK A index.html ===');
let tot = 0;
for (const [f, a] of Object.entries(indexLinks)) {
  tot += a.length;
  console.log(String(a.length).padStart(3) + '  ' + f + '   [' + [...new Set(a)].join(' | ') + ']');
}
console.log('TOTALE: ' + tot);
