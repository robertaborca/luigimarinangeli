// Verifica la logica del token temporale del form contatti.
//
// PHP non è disponibile in locale, quindi il test riproduce in Node le stesse
// operazioni di form-token.php e contact-form.php (hash_hmac sha256 in hex,
// hash_equals, finestra 3s-2h) e controlla che i casi limite finiscano dove
// devono. Serve a validare la logica, non l'esecuzione PHP: quella va
// verificata sul server dopo il deploy.
import crypto from 'crypto';
import fs from 'fs';

const CHIAVE = 'chiave-di-test-non-usata-in-produzione';
const MIN = 3;
const MAX = 7200;

// equivalente di form-token.php
function emettiToken(adesso) {
  const ts = String(adesso);
  return { ts, sig: crypto.createHmac('sha256', CHIAVE).update(ts).digest('hex') };
}

// come form-token.js: il token finisce nei campi nascosti del form
function comePost(token) {
  return { form_ts: token.ts, form_sig: token.sig };
}

// equivalente della validazione in contact-form.php
function valida(post, adesso, chiave = CHIAVE) {
  const ts = String(post.form_ts ?? '');
  const sig = String(post.form_sig ?? '');
  if (ts === '' || sig === '' || !/^\d+$/.test(ts)) return 'scaduto';
  const attesa = crypto.createHmac('sha256', chiave).update(ts).digest('hex');
  if (attesa.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(attesa), Buffer.from(sig))) return 'scaduto';
  const eta = adesso - Number(ts);
  if (eta < MIN || eta > MAX) return 'scaduto';
  return 'ok';
}

let falliti = 0;
function verifica(desc, atteso, effettivo) {
  const ok = atteso === effettivo;
  if (!ok) falliti++;
  console.log((ok ? 'PASS  ' : 'FAIL  ') + desc + (ok ? '' : `   (atteso ${atteso}, ottenuto ${effettivo})`));
}

const T = 1790000000;

verifica('token valido dopo 10s', 'ok', valida(comePost(emettiToken(T)), T + 10));
verifica('token valido a 2h meno 1s', 'ok', valida(comePost(emettiToken(T)), T + MAX - 1));
verifica('invio istantaneo (0s) rifiutato', 'scaduto', valida(comePost(emettiToken(T)), T));
verifica('invio a 2s rifiutato', 'scaduto', valida(comePost(emettiToken(T)), T + 2));
verifica('invio esattamente a 3s accettato', 'ok', valida(comePost(emettiToken(T)), T + MIN));
verifica('token scaduto oltre 2h', 'scaduto', valida(comePost(emettiToken(T)), T + MAX + 1));
verifica('token assente (bot che posta diretto)', 'scaduto', valida({}, T + 10));
verifica('solo ts senza firma', 'scaduto', valida({ form_ts: String(T) }, T + 10));
verifica('ts non numerico', 'scaduto', valida({ form_ts: '12a4', form_sig: 'x'.repeat(64) }, T + 10));
verifica('firma sbagliata', 'scaduto', valida({ form_ts: String(T), form_sig: 'a'.repeat(64) }, T + 10));
verifica('firma di un altro timestamp', 'scaduto',
  valida({ form_ts: String(T), form_sig: emettiToken(T + 60).sig }, T + 10));
verifica('firma con chiave diversa (chiave non indovinabile)', 'scaduto',
  valida(comePost(emettiToken(T)), T + 10, 'chiave-sbagliata'));
verifica('timestamp nel futuro', 'scaduto', valida(comePost(emettiToken(T + 600)), T));

// Coerenza con il codice reale: le costanti del PHP devono combaciare
const php = fs.readFileSync('contact-form.php', 'utf8');
const min = Number((php.match(/\$TOKEN_MIN_SECONDI\s*=\s*(\d+)/) || [])[1]);
const max = Number((php.match(/\$TOKEN_MAX_SECONDI\s*=\s*(\d+)/) || [])[1]);
verifica('TOKEN_MIN_SECONDI in contact-form.php == 3', MIN, min);
verifica('TOKEN_MAX_SECONDI in contact-form.php == 7200', MAX, max);
verifica('honeypot risponde 204 senza redirect', true, /http_response_code\(204\)/.test(php));
verifica('honeypot non manda piu su grazie.html', false,
  /hp_riferimento[\s\S]{0,200}Location: .*REDIRECT_OK/.test(php));

console.log('\n' + (falliti ? falliti + ' test falliti' : 'Tutti i test passati'));
process.exit(falliti ? 1 : 0);
