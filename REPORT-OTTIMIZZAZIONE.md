# Report ottimizzazione Lighthouse — sito Luigi Marinangeli

> Lavoro svolto sul branch `seo-audit-fixes` seguendo il piano in `PIANO-LIGHTHOUSE.md`, blocchi P0→P5.
> Commit di riferimento: da `beab65f` a `8c42490`.

---

## Punteggi: baseline vs atteso

Non ho potuto rilanciare Lighthouse io stesso in questo ambiente (nessun browser con DevTools/Lighthouse disponibile, solo un motore headless per verifiche visive/funzionali). La tabella sotto riporta la baseline del piano; la colonna "Atteso" riflette cosa dovrebbe cambiare in base agli interventi fatti, ma **va confermata rilanciando l'audit reale**.

| Pagina | Device | Perf (prima→atteso) | A11y (prima→atteso) | FCP/LCP prima | Intervento principale |
|---|---|---|---|---|---|
| `/index.html` | mobile | 75 → ≥90 | 100 | LCP 5,1s | P0 (carosello+consulenze), P1, P2, P5 |
| `/SRC/immobili.html` | mobile | 73 → ≥90 | 100 | LCP 14,6s | P0 (griglia immobili responsive) |
| `/SRC/immobili.html` | desktop | 87 → ≥90 | 100 | LCP 2,5s | P0, P1 |
| `/SRC/compra-casa.html` | mobile | 93 → ≥95 | 96 → 100 | CLS 0,092 | P2 (metric override font), P3 |
| `/SRC/vendi-casa.html` | mobile | 95 → ≥95 | 96 → 100 | CLS 0,032 | P2, P3 |
| `/SRC/consulenza.html` | mobile | 96 | 100 | CLS 0,037 | P1, P2 (CLS via font fallback) |
| `/CASE/casa-colonica-…` | mobile | 92 → ≥95 | 89 → 100 | CLS 0,014 | P0 (gallery), P3 |
| `/CASE/casa-colonica-…` | desktop | 100 | 89 → 100 | — | P3 |

**Obiettivo del piano** (≥90 in tutte le categorie, mobile, tutte le pagine): il lavoro copre tutti i punti diagnosticati; la conferma numerica richiede un nuovo giro di Lighthouse.

---

## P0 — Immagini responsive
- 12 foto di copertina su `SRC/immobili.html` + 185 foto di galleria sulle 13 pagine `CASE/`: aggiunti `srcset`/`sizes`/`width`/`height` reali (da metadati, non stimati), `fetchpriority="high"` sulla prima immagine di ogni pagina/galleria, `loading="lazy"` sulle altre.
- Generate 417 varianti (`-400`/`-800`/`-1200.webp`, qualità 74) via `tools/generate-responsive-images.js`.
- `index.html`: stesso trattamento su 12 foto del carosello immobili + 3 foto consulenze (che avevano `height="225px"`/`width="465px"` — attributi HTML non validi per il suffisso "px", quindi **ignorati dal browser**: niente riserva di spazio, rischio CLS reale, ora corretto).
- Foto "Chi sono" convertita da PNG a WebP (64,3KB → 32,5KB).
- Immagine hero: già responsive con variante mobile e preload corretti da una sessione precedente, nessun intervento necessario.
- 2 riferimenti a foto già mancanti (`IMG/LM267`, `IMG/LM276`) trovati dentro 2 card **commentate** (disattivate) in `immobili.html`: non impattano nulla di live, lasciati intatti.

## P1 — CSS render-blocking
- CSS critico (reset, tipografia, navbar, hero, whatsapp-float) inline in `<style id="critical-css">` su tutte le 29 pagine — due varianti (navbar standard ~7,9KB; navbar landing SRC ~4KB), generate dal CSS reale via parser, non trascritte a mano.
- Tutti i `<link rel="stylesheet">` (39 su 29 pagine) convertiti a `preload`+`onload`+`noscript`.
- CSS già minificato (una riga), nessun intervento aggiuntivo necessario.
- **Non risolto**: "Reduce unused CSS <10KB/pagina" richiederebbe di spezzare il foglio globale per pagina/sezione — refactor più ampio, non fatto in questo giro.

## P2 — Font e CLS
- Subset Latin (ASCII + accentate italiane + tipografia + €) su Montserrat/Montserrat-italic/SUSE, più restrizione dell'asse variabile `wght` da 100-900 a 100-700 (unici pesi usati). Great Vibes già sottoposto a subset sul solo testo dell'hero.
- Peso totale font: 164KB → 75,6KB (sotto la soglia 80KB del piano).
- Due `@font-face` di fallback (`Montserrat Fallback`, `SUSE Fallback`, `src:local('Arial')`) con `size-adjust`/`ascent-override`/`descent-override` calcolati dai metadati reali dei font (via `@capsizecss/unpack`), inseriti in testa a tutti gli stack `font-family`: azzera lo scatto layout dello swap invece di limitarsi a `font-display:swap` (già presente).
- Preload di `montserrat.woff2`/`suse.woff2` su tutte le pagine, `great-vibes.woff2` anche su `index.html` (unica pagina dove è above-the-fold).
- `.whatsapp-float` aggiunto al CSS critico (era già markup statico con `position:fixed` e dimensioni esplicite, ma senza queste regole nel blocco critico avrebbe potuto lampeggiare senza stile).

## P3 — Accessibilità
- `.related-property-card__price`: colore brand `#aa9c77` (2,72:1 su bianco) → `#776d53` (5,13:1), confermato con te prima di applicarlo; il brand resta invariato ovunque altrove.
- `.breadcrumb a`: sottolineatura permanente (contrasto link/testo circostante era solo 1,44:1, ben sotto la soglia 3:1 per affidarsi al solo colore).
- `.gallery-dot`: area cliccabile 24×24px via `::after` trasparente (il pallino resta visivamente piccolo); aumentato il gap così i centri distano ≥24px.
- `.contact-form-divider`: `#6b7280` (4,20:1 su `#efefef`) → `#4b5563` (6,57:1).
- Tutti questi fix sono nei fogli condivisi: si applicano automaticamente a tutte le pagine che usano quelle classi (13/13 pagine CASE per breadcrumb/gallery-dot, 12/13 per il prezzo — una non ha immobili correlati, entrambe vendi-casa/compra-casa per il divider).

## P4 — SEO e metadati
- Già a posto: title, description, canonical e Open Graph univoci su tutte le 29 pagine (nessuna azione necessaria, verificato con uno script che confronta ogni pagina).

## P5 — JavaScript e main thread
- Forced reflow reale in `ReviewsCarousel` (index.html): lettura di `offsetWidth` subito dopo una scrittura di `innerHTML` — separate lettura e scrittura.
- `ReviewsCarousel` estratta dall'inline `<script>` a `scripts/reviews-carousel.js` (esterno, deferred), inizializzazione via `IntersectionObserver` invece che su `DOMContentLoaded` (parte solo quando la sezione si avvicina al viewport). Stesso trattamento per `property-carousel.js`.
- Bug preesistente scoperto e corretto: `updateDots()` del carosello recensioni cercava `.dot` in tutta la pagina invece che dentro `#carouselDots`, in conflitto con i dot del carosello immobili.
- Rimosso `async` ridondante (in conflitto con `defer`) da `script.min.js`/`nav.min.js`.
- `.carousel-btn`: transizione da `.3s` implicito ("all", include `background` non compositabile) a `transform .3s` soltanto.
- `firma.svg` ottimizzato con SVGO: 58,4KB → 32,3KB (-44,6%).

## Pulizia aggiuntiva (non nel piano originale, richiesta a parte)
- Rimossa la pipeline Sass/PostCSS in root (`SASS/`, `package.json`, `package-lock.json`): mai collegata al sito, `CSS/style.css` è editato a mano direttamente.
- Rimosse 3 regole CSS confermate morte (`.article__immobili .card-image--center`, `.chiama--landing`, `.hidden-mobile--landing`) — verificate con grep su tutto HTML/JS del sito prima di cancellarle, non solo via coverage a runtime (che dava troppi falsi positivi su font-face, media query mobile e stati hover/focus mai esercitati a viewport desktop).
- Rimosso uno statement morto (`void(0);`) in `nav.js`.
- Verificato che tutti gli script `.min.js` sono aggiornati rispetto ai sorgenti `.js` e che ogni pagina referenzia solo versioni minificate esistenti (nessun link rotto, nessun riferimento a sorgenti non minificati) — utile visto che su Hostinger andranno caricati solo i `.min.js`.

---

## Voci rimaste aperte (dipendenti dall'hosting, come da piano)
- **Compressione gzip/brotli**: non applicata in locale con Live Server; va abilitata lato Hostinger (di solito già attiva su hosting condiviso Apache/LiteSpeed via `.htaccess` o configurazione pannello).
- **HTTP/2 / "Modern HTTP"**: dipende dal server, non dal codice.
- **Preconnect**: nessuno da aggiungere, tutte le risorse sono first-party.
- **Cache lifetimes**: già segnalato come *passed* nell'audit originale.

## Altre voci non completamente risolte
- **Reduce unused CSS <10KB/pagina** (P1): il CSS critico + l'async-load risolvono il render-blocking, ma il foglio esterno resta globale (non diviso per pagina/sezione). Per arrivare sotto i 10KB servirebbe uno split del CSS più invasivo.
- **DOM size di index.html** (P5f, 884 elementi): non toccato, il piano stesso lo segnala come "non critico" da rivedere solo se il TBT resta alto dopo gli altri interventi — da verificare con un nuovo audit.

## Prossimo passo
Rilanciare Lighthouse mobile (Moto G Power, Slow 4G) sulle 6 URL di riferimento e confrontare con la baseline sopra. Se qualche pagina resta sotto 90, i candidati più probabili sono il DOM size di `index.html` e l'unused CSS residuo.
