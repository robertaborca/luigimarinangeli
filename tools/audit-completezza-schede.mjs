// Tabella di controllo della completezza delle schede immobile.
// Legge SOLO ciò che è già pubblicato: dove il dato manca stampa
// "DA CHIEDERE", senza dedurlo e senza stimarlo.
import fs from 'fs';

const CAMPI = ['planimetria', 'APE', 'spese', 'dist. mare', 'dist. centro', 'orientamento', 'video/tour', 'foto'];

// le voci di Prossimità compaiono come "<li>emoji Etichetta (valore)</li>"
// oppure "<li>emoji Etichetta: valore</li>": servono entrambe le forme
function daProssimita(html, etichetta) {
  const blocco = (html.match(/<h3>Prossimità<\/h3>\s*<ul>([\s\S]*?)<\/ul>/) || [])[1];
  if (!blocco) return null;
  for (const m of blocco.matchAll(/<li>([^<]*)<\/li>/g)) {
    const voce = m[1].replace(/[^\S ]/g, ' ').trim();
    if (!etichetta.test(voce)) continue;
    const tra = voce.match(/\(([^)]+)\)/);
    if (tra) return tra[1].trim();
    const dopo = voce.match(/:\s*([\d.,]+\s*(?:m|km|metri|chilometri)\b.*)$/i);
    if (dopo) return dopo[1].trim();
  }
  return null;
}

function analizza(html) {
  const testo = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  // spese: solo se accanto alla parola compare un importo, altrimenti si chiede
  let spese = null;
  const ms = testo.match(/spese\s+condominiali[^.]{0,60}/i);
  if (ms) {
    // la periodicità fa parte del dato: "70 €" da solo è fuorviante
    const imp = ms[0].match(/(?:€\s*[\d.]+|[\d.]+\s*€)\s*(?:\/\s*(?:mese|anno))?/i);
    if (imp) spese = imp[0].replace(/\s+/g, '');
    else if (/senza spese condominiali|nessuna spesa condominiale/i.test(ms[0])) spese = 'nessuna (indipendente)';
  }

  const ape = (html.match(/<p>APE:\s*([^<]+)<\/p>/) || [])[1]
    || (/<p>Regolamentazione:\s*APE<\/p>/.test(html) ? 'dichiarata, classe assente' : null)
    || (testo.match(/classe energetica\s+([A-G][0-9+]?)\b/i) || [])[1];

  return {
    planimetria: /planimetri/i.test(html) ? 'sì' : null,
    APE: ape ? ape.trim() : null,
    spese,
    'dist. mare': daProssimita(html, /mare|spiaggia/i),
    'dist. centro': daProssimita(html, /centro citt|centro\b/i),
    orientamento: (html.match(/<p>Esposizione:\s*([^<]+)<\/p>/) || [])[1]?.trim() || null,
    'video/tour': /(virtual ?tour|youtube\.com|youtu\.be|vimeo|<video)/i.test(html) ? 'sì' : null,
    foto: String((html.match(/property-gallery__cell/g) || []).length || 0),
  };
}

const files = fs.readdirSync('CASE').filter((f) => f.endsWith('.html') && !f.includes('stabilimento')).sort();
const righe = files.map((f) => {
  const d = analizza(fs.readFileSync('CASE/' + f, 'utf8'));
  const rif = (fs.readFileSync('CASE/' + f, 'utf8').match(/Rif\.\s*(LM\d+)/) || [])[1] || '?';
  return [rif + ' ' + f.replace(/-in-vendita.*|\.html$/, '').slice(0, 26), ...CAMPI.map((c) => d[c] || 'DA CHIEDERE')];
});

const intest = ['scheda', ...CAMPI];
const larg = intest.map((h, i) => Math.max(h.length, ...righe.map((r) => String(r[i]).length)));
const riga = (r) => r.map((v, i) => String(v).padEnd(larg[i])).join('  ');
console.log(riga(intest));
console.log(larg.map((l) => '-'.repeat(l)).join('  '));
righe.forEach((r) => console.log(riga(r)));

const mancanti = righe.flatMap((r) => r.slice(1).filter((v) => v === 'DA CHIEDERE')).length;
console.log('\nCelle da chiedere a Luigi: ' + mancanti + ' su ' + righe.length * CAMPI.length);
