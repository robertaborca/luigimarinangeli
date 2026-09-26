// Simulatore delle RewriteRule di .htaccess: per ogni combinazione
// protocollo x host x path conta quanti 301 servono per arrivare all'URL
// finale. Serve a provare che non ci siano catene (>1 hop) ne' loop.
import fs from 'fs';

const txt = fs.readFileSync('.htaccess', 'utf8');
const lines = txt.split(/\r?\n/);

// Parsing minimale: RewriteCond accumulate, applicate alla RewriteRule seguente.
const rules = [];
let pending = [];
for (const raw of lines) {
  const l = raw.trim();
  if (!l || l.startsWith('#')) continue;
  let m;
  if ((m = l.match(/^RewriteCond\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?$/))) {
    pending.push({ test: m[1], pattern: m[2], flags: m[3] || '' });
  } else if ((m = l.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?$/))) {
    rules.push({ pattern: m[1], sub: m[2], flags: m[3] || '', conds: pending });
    pending = [];
  }
}

function condsPass(conds, ctx) {
  if (!conds.length) return true;
  // [OR] concatena la condizione con la successiva
  const results = conds.map((c) => {
    const subject = c.test
      .replace('%{HTTPS}', ctx.https ? 'on' : 'off')
      .replace('%{HTTP_HOST}', ctx.host);
    let pat = c.pattern;
    let negate = false;
    if (pat.startsWith('!')) { negate = true; pat = pat.slice(1); }
    const ci = /\[NC\]/i.test(c.flags) || c.flags.includes('NC');
    const ok = new RegExp(pat, ci ? 'i' : '').test(subject);
    return { ok: negate ? !ok : ok, or: /(^|,)OR(,|$)/i.test(c.flags) };
  });
  // valuta come catena di AND con gruppi OR
  let acc = null;
  let i = 0;
  while (i < results.length) {
    let group = results[i].ok;
    while (results[i] && results[i].or) { i++; group = group || results[i].ok; }
    i++;
    acc = acc === null ? group : acc && group;
  }
  return acc;
}

// Un giro = una risposta del server. Ritorna {status, location} oppure {status:200}
function serve(url) {
  const u = new URL(url);
  const ctx = { https: u.protocol === 'https:', host: u.host };
  // mod_rewrite in .htaccess alla document root: il path perde lo slash iniziale
  const relPath = decodeURIComponent(u.pathname).replace(/^\//, '');
  for (const r of rules) {
    const ci = /NC/.test(r.flags);
    const re = new RegExp(r.pattern, ci ? 'i' : '');
    const m = re.exec(relPath);
    if (!m) continue;
    if (!condsPass(r.conds, ctx)) continue;
    let target = r.sub.replace(/\$(\d)/g, (_, d) => m[Number(d)] ?? '');
    if (!/^https?:/.test(target)) target = u.origin + (target.startsWith('/') ? target : '/' + target);
    if (target === u.href) continue; // Apache non redirige su se stesso
    return { status: 301, location: target };
  }
  return { status: 200 };
}

function follow(url, max = 6) {
  const hops = [];
  let cur = url;
  for (let i = 0; i < max; i++) {
    const r = serve(cur);
    if (r.status === 200) return { hops, final: cur, loop: false };
    hops.push(r.location);
    if (hops.filter((h) => h === r.location).length > 1) return { hops, final: r.location, loop: true };
    cur = r.location;
  }
  return { hops, final: cur, loop: true };
}

const paths = [
  '/',
  '/SRC/immobili.html',
  '/CASE/la-casa-con-gli-oblo-in-vendita-a-senigallia.html',
  '/BLOG/compromesso-e-rogito-differenze.html',
  '/privacy-cookie-policy.html',
  '/CASE/la-casa-con-gli-obl%C3%B2-in-vendita-a-senigallia.html',
  '/CASE/la-casa-con-gli-oblò-in-vendita-a-senigallia.html',
  '/BLOG/guida-ai-senigallia-dove-comprare-casa',
  '/BLOG/guida-ai-senigallia-dove-comprare-casa.html',
  '/consulenza-fast.html',
  '/SRC/consulenza-personalizzata.html',
  '/analisi-documentale.html',
  '/CASE/villino-indipendente-senigallia.html',
  '/CASE/appartamento-nuovo-con-giardino-in-vendita-a-senigallia-ponte-rosso.html',
  '/CASE/stabilimento-balneare-rotonda-di-senigallia.html',
];
const origins = [
  'http://lecasediluigi.com',
  'http://www.lecasediluigi.com',
  'https://lecasediluigi.com',
  'https://www.lecasediluigi.com',
];

let worst = 0, loops = 0, chains = [];
for (const p of paths) {
  console.log('\n--- ' + p);
  for (const o of origins) {
    const start = o + p;
    const { hops, final, loop } = follow(start);
    worst = Math.max(worst, hops.length);
    if (loop) loops++;
    if (hops.length > 1) chains.push(start + ' -> ' + hops.join(' -> '));
    const tag = loop ? 'LOOP' : hops.length + ' hop';
    console.log(`  [${tag}] ${o.padEnd(30)} => ${final}`);
  }
}
console.log('\n===========================================');
console.log('hop massimi: ' + worst);
console.log('loop rilevati: ' + loops);
if (chains.length) { console.log('CATENE (>1 hop):'); chains.forEach((c) => console.log('  ' + c)); }
else console.log('nessuna catena: ogni URL raggiunge la destinazione con al massimo 1 redirect');
