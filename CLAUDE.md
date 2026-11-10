# CLAUDE.md – lecasediluigi.com

Sito di Le Case di Luigi, agenzia immobiliare di Luigi Marinangeli a Senigallia.
Sito statico (HTML, CSS, JS) con form di contatto in PHP (PHPMailer), ospitato su Hostinger.
Repo: robertaborca/luigimarinangeli.

## Regole di lavoro

- Lavora sul branch indicato nel prompt (di solito `seo-audit-fixes`). Mai su `main`.
- Non fare push e non fare deploy: il deploy lo fa Roberta dopo aver testato in locale.
- Alla fine di ogni task, fai un riepilogo: file toccati, cosa è cambiato, cosa resta da verificare.
- Quando Roberta dice che sta per caricare su Hostinger, elenca i file da caricare, divisi tra immagini e pagine, e ricorda di caricare prima le immagini e poi l'HTML. Escludi `CLAUDE.md`, `tools/` e le foto originali.
- Se trovi problemi fuori dal perimetro del task, elencali nel riepilogo senza correggerli.
- Non inventare dati sugli immobili (metrature, camere, prezzi, caratteristiche): se mancano, chiedi.
- Prima di cancellare file (pagine, immagini, script) chiedi conferma, salvo che il prompt lo dica esplicitamente.
- Eccezione: le foto originali (`Picture-*.jpg` e simili) di un immobile, una volta convertite in `.webp` e verificate, vanno sempre cancellate in automatico, senza chiedere. Così non finiscono per sbaglio su Hostinger.

## Struttura

- `index.html` – home
- `SRC/` – pagine principali (immobili, consulenza, vendi-casa, compra-casa, blog…)
- `CASE/` – schede dei singoli immobili
- `ZONE/` – pagine per zona (Ciarnin, Scapezzano, ville e case indipendenti)
- `IMG/LMxxx/` – immagini di ogni immobile, una cartella per codice
- `CSS/` – `style.css` e font
- `scripts/` – sorgenti `.js` e versioni `.min.js` (le pagine caricano le `.min.js`)
- `.htaccess` – header di sicurezza (CSP, HSTS, Permissions-Policy), blocchi FilesMatch, redirect

## Posizionamento e testi

- Riferimento geografico: "Senigallia e provincia di Ancona". Mai "Ancona" da sola.
- Usa "agenzia immobiliare" nei title e nelle meta description dove ha senso.
- Il pubblico è di fascia alta (catalogo fatto soprattutto di ville e villini): testi sobri e concreti, niente toni da annuncio economico.
- Le pagine parlano in prima persona come Luigi e danno del tu al visitatore ("Contattami", "Scopri la mia selezione").
- Contatti ufficiali: telefono +39 379.3691313 (`tel:+393793691313`), email info@lecasediluigi.com.
- Il vecchio indirizzo (Via Carlo Pisacane 10) e il vecchio numero (3356199476) non devono mai comparire. Se li trovi, segnalali.

## Immobili

- Un immobile compare in più punti: card in home, card in `SRC/immobili.html`, eventuali pagine in `ZONE/`, scheda in `CASE/`, JSON-LD. Quando ne aggiungi, modifichi o togli uno, aggiorna tutti i punti e verifica che nome, prezzo e località coincidano.
- Il JSON-LD `ItemList` di `SRC/immobili.html` deve contenere esattamente le card visibili, nello stesso ordine, con `position` consecutive da 1.
- I prezzi si scrivono con il simbolo €: `€240.000`. In alternativa, "Trattativa riservata".
- Immobile venduto: togli card e link interni ovunque, elimina la scheda in `CASE/`, aggiungi in `.htaccess` un redirect 301 dalla sua URL a `/SRC/immobili.html` e togli la URL dalla sitemap. Non aggiungere avvisi di "venduto" o "non più disponibile". L'unica eccezione già esistente è la scheda dello stabilimento balneare: non toccarla.
- Foto di un immobile, ordine: nel carosello della scheda la foto migliore va per prima (`fetchpriority="high"`) e il rendering, se c'è, per ultimo (dopo la mappa). Il rendering resta `og-image`, immagine di copertina, `thumbnail` e `image` del JSON-LD. Le card (home, `SRC/immobili.html`, "Altri immobili" nelle schede) usano la foto migliore, non il rendering.
- Foto di un immobile, nomi: `<soggetto>-<dettaglio>-<tipo>-<località>`, minuscolo con trattini, per esempio `camino-in-pietra-salone-appartamento-via-venezia-senigallia`. Quattro varianti (`-400`, `-600`, `-800`, `-1200`) più l'originale in `.webp` (max 1600 px, qualità 74), con alt descrittivo di tipo e località.
- Immobile sospeso: commenta la card con `<!-- TEMP NON DISPONIBILE – [nome] – da ripristinare ... FINE TEMP NON DISPONIBILE – [nome] -->`, toglilo dal JSON-LD, lascia online la scheda in `CASE/`.

## HTML, SEO e performance

- I link interni alla home puntano a `/`, mai a `/index.html`.
- Ogni pagina ha: title, meta description, canonical, Open Graph, Twitter card, eventuale JSON-LD. Mantieni coerenti tra loro title, og:title e twitter:title (e lo stesso per le description).
- Immagini: formato `.webp` con `srcset` (400, 600, 800, 1200 e originale), `sizes`, `width` e `height`, `decoding="async"`. `loading="lazy"` su tutte tranne la prima visibile, che usa `fetchpriority="high"`.
- Alt descrittivi, con tipo di immobile e località.
- Ogni pagina ha un blocco `<style id="critical-css">` inline: se modifichi stili above the fold, aggiorna sia `style.css` sia il critical CSS delle pagine interessate.
- Se modifichi un sorgente in `scripts/`, segnala che va rigenerato il `.min.js` corrispondente (chiedi prima di farlo tu).
- Se aggiungi uno script, un font o una risorsa esterna, verifica che la CSP in `.htaccess` lo consenta e segnala cosa va cambiato.

## Analytics

- GA4 traccia questi eventi di contatto: `generate_lead`, `click_telefono`, `click_whatsapp`, `click_calendly`, `click_paypal`. La logica è in `scripts/analytics-events.js`.
- Non rimuovere né rinominare gli attributi `data-track` e non cambiare classi o struttura dei link di contatto senza verificare che gli eventi continuino a scattare.

## Sicurezza

- Non toccare i blocchi FilesMatch e gli header di sicurezza in `.htaccess` salvo richiesta esplicita.
- Questo file non deve essere raggiungibile dal web: resta bloccato in `.htaccess`.
