// Test del listener GA4 senza browser: minima simulazione DOM sufficiente
// per il codice di analytics-events.js (closest, querySelector, eventi).
import fs from 'fs';
import vm from 'vm';

const src = fs.readFileSync('scripts/analytics-events.js', 'utf8');

function creaAmbiente({ pathname, h1, ogTitle, referrer, gtagPresente = true }) {
  const inviati = [];
  const listeners = {};

  function makeEl(tag, attrs = {}, parent = null) {
    const el = {
      tagName: tag.toUpperCase(),
      attrs,
      parentNode: parent,
      textContent: attrs._text || '',
      get content() { return attrs.content; },
      getAttribute(n) { return n in attrs ? attrs[n] : null; },
      matches(sel) {
        if (sel === 'a[href]') return this.tagName === 'A' && 'href' in attrs;
        if (sel === '[data-analytics-event]') return 'data-analytics-event' in attrs;
        return false;
      },
      closest(sel) {
        let cur = this;
        while (cur) { if (cur.matches && cur.matches(sel)) return cur; cur = cur.parentNode; }
        return null;
      },
    };
    return el;
  }

  const document = {
    readyState: 'complete',
    referrer: referrer || '',
    querySelector(sel) {
      if (sel === 'h1') return h1 ? makeEl('h1', { _text: h1 }) : null;
      if (sel === 'meta[property="og:title"]') return ogTitle ? makeEl('meta', { content: ogTitle }) : null;
      return null;
    },
    addEventListener(tipo, fn) { (listeners[tipo] ||= []).push(fn); },
    removeEventListener(tipo, fn) { listeners[tipo] = (listeners[tipo] || []).filter((f) => f !== fn); },
    dispatchEvent(e) { (listeners[e.type] || []).forEach((f) => f(e)); },
  };

  const window = {
    location: { pathname, search: '', host: 'www.lecasediluigi.com' },
    document,
  };
  if (gtagPresente) window.gtag = (tipo, nome, params) => { if (tipo === 'event') inviati.push({ nome, params }); };

  const ctx = {
    window, document, URL,
    CustomEvent: class { constructor(t) { this.type = t; } },
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);

  return { inviati, document, makeEl, listeners, window, ctx };
}

function click(env, el) {
  (env.listeners.click || []).forEach((fn) => fn({ target: el }));
}

let falliti = 0;
function verifica(desc, atteso, effettivo) {
  const ok = JSON.stringify(effettivo) === JSON.stringify(atteso);
  if (!ok) falliti++;
  console.log((ok ? 'PASS  ' : 'FAIL  ') + desc);
  if (!ok) console.log('        atteso:   ' + JSON.stringify(atteso) + '\n        ottenuto: ' + JSON.stringify(effettivo));
}

// --- 1. click su tel: da una scheda immobile: include nome_immobile
{
  const env = creaAmbiente({ pathname: '/CASE/la-casa-con-gli-oblo-in-vendita-a-senigallia.html', h1: 'La casa con gli oblò' });
  click(env, env.makeEl('a', { href: 'tel:+393793691313' }));
  verifica('tel: su scheda CASE -> click_telefono con nome_immobile',
    [{ nome: 'click_telefono', params: { page_path: '/CASE/la-casa-con-gli-oblo-in-vendita-a-senigallia.html', nome_immobile: 'La casa con gli oblò' } }],
    env.inviati);
}

// --- 2. click annidato (svg dentro <a>) risale al link
{
  const env = creaAmbiente({ pathname: '/', h1: 'Home' });
  const a = env.makeEl('a', { href: 'https://wa.me/393793691313?text=Ciao' });
  const svg = env.makeEl('svg', {}, a);
  click(env, svg);
  verifica('wa.me con click su figlio -> click_whatsapp, senza nome_immobile fuori da /CASE/',
    [{ nome: 'click_whatsapp', params: { page_path: '/' } }], env.inviati);
}

// --- 3. whatsapp.com/legal NON deve contare come contatto
{
  const env = creaAmbiente({ pathname: '/privacy-cookie-policy.html' });
  click(env, env.makeEl('a', { href: 'https://www.whatsapp.com/legal/privacy-policy' }));
  verifica('whatsapp.com/legal -> nessun evento', [], env.inviati);
}

// --- 4. Calendly
{
  const env = creaAmbiente({ pathname: '/SRC/consulenza.html' });
  click(env, env.makeEl('a', { href: 'https://calendly.com/lecasediluigi/consulenza-fast' }));
  verifica('calendly.com -> click_calendly',
    [{ nome: 'click_calendly', params: { page_path: '/SRC/consulenza.html' } }], env.inviati);
}

// --- 4b. Calendly con parametri UTM e risposta precompilata (CTA scheda)
{
  const env = creaAmbiente({ pathname: "/CASE/villetta-indipendente-ciarnin-in-vendita-a-senigallia.html", h1: "Villetta indipendente" });
  click(env, env.makeEl("a", { href: "https://calendly.com/lecasediluigi/consulenza-fast?utm_source=scheda-immobile&utm_content=LM293&a1=Immobile%20Rif.%20LM293" }));
  verifica("calendly con parametri -> click_calendly con nome_immobile",
    [{ nome: "click_calendly", params: { page_path: "/CASE/villetta-indipendente-ciarnin-in-vendita-a-senigallia.html", nome_immobile: "Villetta indipendente" } }],
    env.inviati);
}

// --- 5. PayPal (link e bottone con data-analytics-event)
{
  const env = creaAmbiente({ pathname: '/SRC/consulenza.html' });
  click(env, env.makeEl('a', { href: 'https://www.paypal.com/paypalme/lecasediluigi' }));
  click(env, env.makeEl('button', { 'data-analytics-event': 'click_paypal' }));
  verifica('paypal.com e bottone data-analytics-event -> due click_paypal',
    [{ nome: 'click_paypal', params: { page_path: '/SRC/consulenza.html' } },
     { nome: 'click_paypal', params: { page_path: '/SRC/consulenza.html' } }], env.inviati);
}

// --- 6. link interno normale: nessun evento
{
  const env = creaAmbiente({ pathname: '/' });
  click(env, env.makeEl('a', { href: '/SRC/immobili.html' }));
  verifica('link interno -> nessun evento', [], env.inviati);
}

// --- 7. generate_lead su grazie.html con referrer interno
{
  const env = creaAmbiente({ pathname: '/grazie.html', referrer: 'https://www.lecasediluigi.com/SRC/vendi-casa.html' });
  verifica('grazie.html -> generate_lead con form_origine',
    [{ nome: 'generate_lead', params: { page_path: '/grazie.html', form_origine: '/SRC/vendi-casa.html' } }], env.inviati);
}

// --- 8. generate_lead NON parte sulle altre pagine
{
  const env = creaAmbiente({ pathname: '/SRC/vendi-casa.html' });
  verifica('pagina con form -> nessun generate_lead al caricamento', [], env.inviati);
}

// --- 9. senza consenso nessun evento; all'accettazione parte generate_lead
{
  const env = creaAmbiente({ pathname: '/grazie.html', referrer: 'https://www.lecasediluigi.com/', gtagPresente: false });
  verifica('grazie.html senza consenso -> nessun evento', [], env.inviati);
  // l'utente accetta: cookie-consent.js definisce gtag e notifica
  env.window.gtag = (tipo, nome, params) => { if (tipo === 'event') env.inviati.push({ nome, params }); };
  env.document.dispatchEvent(new env.ctx.CustomEvent('lecasediluigi:analytics-ready'));
  verifica('dopo il consenso -> generate_lead differito',
    [{ nome: 'generate_lead', params: { page_path: '/grazie.html', form_origine: '/' } }], env.inviati);
  // non deve partire una seconda volta
  env.document.dispatchEvent(new env.ctx.CustomEvent('lecasediluigi:analytics-ready'));
  verifica('secondo segnale -> nessun doppione', 1, env.inviati.length);
}

// --- 10. referrer esterno: evento senza form_origine
{
  const env = creaAmbiente({ pathname: '/grazie.html', referrer: 'https://www.google.com/' });
  verifica('referrer esterno -> generate_lead senza form_origine',
    [{ nome: 'generate_lead', params: { page_path: '/grazie.html' } }], env.inviati);
}

console.log('\n' + (falliti ? falliti + ' test falliti' : 'Tutti i test passati'));
process.exit(falliti ? 1 : 0);
