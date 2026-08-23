# Piano di intervento Lighthouse — sito Luigi Marinangeli

> **Istruzioni per Claude.** Questo file è la specifica di lavoro. Esegui i task nell'ordine dato (P0 → P5).
> Non passare al blocco successivo finché i criteri di accettazione del blocco corrente non sono soddisfatti.
> Tutti i dati qui sotto vengono da audit Lighthouse 13.4.0 eseguiti il 23/08/2026 su `http://127.0.0.1:5500`.

---

## 0. Contesto del progetto

Sito statico multi-pagina, servito in locale con Live Server.

```
/index.html                                        (116 KiB di HTML — CSS e JS inline)
/SRC/immobili.html                                 (41,6 KiB)
/SRC/compra-casa.html
/SRC/vendi-casa.html
/SRC/consulenza.html
/CASE/<slug-immobile>.html                         (pagine dettaglio, es. casa-colonica-ristrutturata-barbara-senigallia.html)
/CSS/style.css                                     (35,8 KiB — foglio globale, render-blocking)
/SRC/style.css                                     (9,7–11 KiB — secondo foglio, render-blocking)
/scripts/property-carousel.min.js
/scripts/property-gallery.min.js
/scripts/cookie-consent.min.js
/fonts/{suse,montserrat,montserrat-italic,great-vibes}.woff2   (~165 KiB totali, self-hosted)
/IMG/…                                             (immagini di brand)
/IMG/LM###/…                                       (foto immobili, tutte .webp a 1600px)
```

### Punteggi attuali (baseline da battere)

| Pagina | Device | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|---|
| `/index.html` | mobile | **75** | 100 | 100 | **92** | 2,7 s | **5,1 s** | 0 | 170 ms |
| `/SRC/immobili.html` | mobile | **73** | 100 | 100 | 100 | 2,0 s | **14,6 s** | 0,013 | 0 |
| `/SRC/immobili.html` | desktop | **87** | 100 | 100 | 100 | 0,5 s | **2,5 s** | 0,015 | 0 |
| `/SRC/compra-casa.html` | mobile | 93 | **96** | 100 | 100 | 2,0 s | 2,6 s | **0,092** | 0 |
| `/SRC/vendi-casa.html` | mobile | 95 | **96** | 100 | 100 | 2,0 s | 2,6 s | 0,032 | 0 |
| `/SRC/consulenza.html` | mobile | 96 | 100 | 100 | 100 | 2,0 s | 2,5 s | 0,037 | 0 |
| `/CASE/casa-colonica-…html` | mobile | 92 | **89** | 100 | 100 | 2,0 s | 3,2 s | 0,014 | 10 ms |
| `/CASE/casa-colonica-…html` | desktop | 100 | **89** | 100 | 100 | 0,5 s | 0,7 s | 0,016 | 0 |

**Obiettivo finale:** ≥ 90 in tutte e quattro le categorie, su mobile, su tutte le pagine.

### Da NON "sistemare" (falsi positivi dell'ambiente locale)

Non perdere tempo su questi punti: sono artefatti di Live Server, non difetti del codice.

- **"No compression applied" / Document request latency** → gzip/brotli è configurazione dell'hosting. Annotalo nel report finale, non toccarlo.
- **"Modern HTTP" (HTTP/1.1)** → idem, dipende dall'host.
- **"Preconnect candidates" / "no origins were preconnected"** → tutte le risorse sono first-party. Nessun preconnect da aggiungere.
- **"Use efficient cache lifetimes"** → già in stato *passed*, e comunque lato server.

---

## P0 — Immagini degli immobili (l'unico vero collo di bottiglia)

**Sintomo.** `/SRC/immobili.html` mobile ha LCP a **14,6 s** e scarica **2.875 KiB** di sole immagini. Lighthouse stima **2.144 KiB** risparmiabili su mobile e **2.913 KiB** su desktop.

**Causa.** La griglia `.properties-grid` monta 10 `img.property-image--landing`, ognuna servita a **1600 px** di larghezza quando lo spazio di layout reale è **373 px su desktop** e **573 px su mobile**. Esempi dall'audit:

| File | Peso | Reale | Visualizzata (mobile) |
|---|---|---|---|
| `IMG/LM294/vialetto-melo-giardino-appartamento-ciarnin-senigal….webp` | 601,0 KiB | 1600×838 | 573×573 |
| `IMG/LM280/facciata-villetta-schiera-ulivi-giardino-scapezzano….webp` | 414,0 KiB | 1600×858 | — |
| `IMG/LM293/esterno-portico-giardino-villetta-ciarnin-senigallia.webp` | 339,4 KiB | 1600×838 | 573×573 |
| `IMG/LM283/vista-aerea-facciata-oasi-scapezzano-senigallia.webp` | 316,0 KiB | 1600×839 | 573×436 |
| `IMG/LM284/facciata-esterna-la-casa-con-gli-oblo-borgo-bicchia….webp` | 264,6 KiB | 1600×838 | 573×441 |
| `IMG/LM290/esterno-casa-colonica-ristrutturata-barbara-senigal….webp` | 248,7 KiB | 1600×838 | 573×382 |
| `IMG/LM297/rendering-facciata-palazzina-appartamento-via-venez….webp` | 239,0 KiB | 1536×804 | 573×382 |
| `IMG/LM272/facciata-villa-lusso-vialetto-ingresso-saline-senig….webp` | 168,5 KiB | 1170×626 | — |
| `IMG/LM291/esterno-palazzina-appartamento-villa-torlonia-senig….webp` | 141,3 KiB | 1600×838 | 573×573 |
| `IMG/LM295/soggiorno-sala-pranzo-appartamento-montemarciano.webp` | 140,8 KiB | 1600×839 | 573×430 |

Lo stesso problema esiste sulle pagine `/CASE/` (523 KiB risparmiabili sulla galleria: file 1600×1068 mostrati a 481×321).

### Cosa fare

**1. Genera le varianti responsive.** Script Node o `sharp`/`cwebp` da lanciare una volta sulla cartella `IMG/`. Per ogni sorgente produci `-400.webp`, `-800.webp`, `-1200.webp` mantenendo l'originale 1600 come fallback massimo. Qualità target 72–78 (Lighthouse segnala anche "increasing the image compression factor could improve this image's download size" — le sorgenti attuali sono compresse troppo poco: 601 KiB per una foto 1600×838 è ~4× il ragionevole).

**2. Riscrivi il markup delle card.** Ogni `img.property-image--landing` deve diventare:

```html
<img
  src="/IMG/LM294/vialetto-melo-giardino-appartamento-ciarnin-senigallia-800.webp"
  srcset="/IMG/LM294/…-400.webp 400w,
          /IMG/LM294/…-800.webp 800w,
          /IMG/LM294/…-1200.webp 1200w"
  sizes="(max-width: 768px) 92vw, (max-width: 1200px) 45vw, 373px"
  width="1600" height="838"
  alt="…"
  loading="lazy" decoding="async"
  class="property-image--landing">
```

- `width`/`height` **sempre presenti** (mantengono l'aspect-ratio e prevengono CLS).
- `sizes` va calibrato sui breakpoint reali del CSS: verifica in `/CSS/style.css` come è definita `.properties-grid` prima di scriverlo. Se sbagli `sizes`, il browser scarica di nuovo la variante troppo grande e il lavoro è inutile.

**3. Gestisci la prima card in modo diverso dalle altre.** Lighthouse su `/SRC/immobili.html` mobile fallisce *LCP request discovery* con "fetchpriority=high should be applied". La prima immagine della griglia (quella above-the-fold) deve avere `fetchpriority="high"` e **non** `loading="lazy"`. Dalla seconda in poi: `loading="lazy"`.

**4. Applica lo stesso trattamento alla galleria delle pagine `/CASE/`** (`div#propertyGalleryList.property-gallery__list`, 20 figli): tutte lazy tranne la prima, tutte con `srcset`/`sizes`/`width`/`height`.

**Criteri di accettazione P0**
- Peso totale trasferito di `/SRC/immobili.html` < **800 KiB** (oggi 3.415 KiB).
- LCP mobile su `/SRC/immobili.html` < **2,5 s** (oggi 14,6 s).
- L'audit *Improve image delivery* non compare più tra gli insight in rosso.
- Nessuna regressione visiva: le foto restano nitide su schermo Retina (per questo la variante 1200w esiste).

---

## P1 — CSS render-blocking

**Sintomo.** Su mobile la catena CSS costa **1.010–1.490 ms** di render-blocking su ogni pagina:

| Pagina | Risparmio stimato | File bloccanti |
|---|---|---|
| `/index.html` | 1.490 ms | `/CSS/style.css` (35,8 KiB, 300 ms) |
| `/SRC/immobili.html` | 1.010 ms | `/SRC/style.css` (9,7 KiB, 310 ms) + `/CSS/style.css` (35,8 KiB, 460 ms) |
| `/SRC/compra-casa.html` | 1.030 ms | `/SRC/style.css` (11,0 KiB) + `/CSS/style.css` |
| `/SRC/vendi-casa.html` | 1.020 ms | idem |
| `/SRC/consulenza.html` | 1.020 ms | idem |
| `/CASE/…` | 1.040 ms | `/CSS/style.css` |

In più, *Reduce unused CSS* segnala che di `/CSS/style.css` è inutilizzato: **32,2 KiB su 35,5** su `immobili.html` desktop, 31,5 KiB su mobile, 23,4 KiB sulle pagine `/CASE/`, 13,1 KiB su `index.html`. Cioè un foglio globale monolitico dove ogni pagina usa il 10–35% delle regole.

### Cosa fare

**1. Estrai il CSS critico** (above-the-fold: reset, tipografia base, `.navbar`, hero/prima sezione, `.cookie-consent-banner`) e mettilo inline in `<style>` nell'`<head>` di ogni pagina. Tienilo sotto i **14 KiB**.

**2. Carica il resto in modo non bloccante:**

```html
<link rel="preload" href="/CSS/style.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/CSS/style.css"></noscript>
```

**3. Unifica i due fogli.** Avere `/CSS/style.css` **e** `/SRC/style.css` sulla stessa pagina raddoppia le richieste bloccanti. Consolida in un unico bundle globale + eventuali file per-pagina caricati solo dove servono. Se `/SRC/style.css` contiene solo regole specifiche delle pagine in `SRC/`, va bene tenerlo separato ma deve essere anch'esso non bloccante.

**4. Minifica** (`Minify CSS` è tra gli audit segnalati su `index.html`).

**Criteri di accettazione P1**
- *Render-blocking requests* sotto i **200 ms** stimati su mobile per ogni pagina.
- *Reduce unused CSS* sotto i **10 KiB** per pagina.
- FCP mobile < **1,8 s** su tutte le pagine (oggi 2,0–2,7 s).

---

## P2 — Font e CLS

**Sintomo.** Quattro woff2 self-hosted (~165 KiB) vengono scoperti solo **dopo** il parsing del CSS, quindi sono in fondo alla catena critica:

```
/index.html (31 ms) → /CSS/style.css (44 ms) → great-vibes.woff2 (204 ms)
                                             → suse.woff2 (204 ms)
                                             → montserrat-italic.woff2 (203 ms)
                                             → montserrat.woff2 (160 ms)
```

E sono i responsabili di quasi tutto il CLS residuo. Lighthouse elenca esplicitamente i font come *layout shift culprits*:

| Pagina | CLS | Elemento che si sposta | Causa |
|---|---|---|---|
| `/SRC/compra-casa.html` | **0,092** | `section.value-proposition` (0,080) | `montserrat.woff2`, `suse.woff2`, `montserrat-italic.woff2` |
| `/SRC/consulenza.html` | 0,037 | `section.consultation-types` (0,028), `a.whatsapp-float` (0,009) | stessi font |
| `/SRC/vendi-casa.html` | 0,032 | `section.value-proposition` (0,023), `a.whatsapp-float` (0,005), `div.highlight` (0,005) | stessi font |
| `/SRC/immobili.html` desktop | 0,015 | `div#navMenuLanding.nav-menu` (0,011), `a.whatsapp-float` (0,003) | `suse.woff2`, `montserrat.woff2` |
| `/SRC/immobili.html` mobile | 0,013 | `div.cookie-consent-banner` (0,009), `a.whatsapp-float` (0,005) | `montserrat.woff2`, `montserrat-italic.woff2` |
| `/CASE/…` | 0,014 | `p.property-text` | tutti e tre |

### Cosa fare

**1. Preload dei soli font above-the-fold** (probabilmente `suse` e `montserrat` regular — verifica quali sono effettivamente usati nel primo viewport prima di aggiungerli):

```html
<link rel="preload" href="/fonts/suse.woff2" as="font" type="font/woff2" crossorigin>
```

Non fare il preload di tutti e quattro: annullerebbe il beneficio.

**2. `font-display: swap`** su ogni `@font-face` (Lighthouse lo suggerisce esplicitamente).

**3. Elimina il salto dello swap con i metric override.** È questo che azzera il CLS, non lo `swap` da solo:

```css
@font-face {
  font-family: 'Montserrat Fallback';
  src: local('Arial');
  size-adjust: 107%;      /* da calibrare con Fontaine o capsize */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
body { font-family: 'Montserrat', 'Montserrat Fallback', sans-serif; }
```

**4. `great-vibes.woff2` (42 KiB) è caricato su `index.html`.** Verifica dove viene usato: se serve solo per la firma del logo, quella è già un SVG (`luigi-marinangeli-consulente-immobiliare-ancona-firma.svg`) — in quel caso rimuovi il font. Se serve per un titolo decorativo, fai il subset ai soli caratteri usati.

**5. Fai il subset latin di tutti i font** (`pyftsubset --unicodes=U+0000-00FF,U+0131,U+0152-0153,U+2000-206F`): tipicamente taglia il 40–60% del peso.

**6. `a.whatsapp-float` sposta il layout su tre pagine.** È un elemento fisso: deve avere `width`/`height` espliciti in CSS e `position: fixed` applicata dal primo paint, non dopo il caricamento dello script.

**Criteri di accettazione P2**
- CLS < **0,05** su tutte le pagine (oggi fino a 0,092).
- Peso font totale < **80 KiB**.
- I font non compaiono più tra i *layout shift culprits*.

---

## P3 — Accessibilità

### P3.1 — Pagine `/CASE/` (punteggio 89, il più basso del sito)

Tre audit falliti:

**a) Contrasto insufficiente** — *Background and foreground colors do not have a sufficient contrast ratio*
Elementi: `span.related-property-card__price`, `a.related-property-card`
→ Porta il rapporto ad almeno **4,5:1** (testo normale). Non ritoccare a occhio: calcola il ratio. Se il prezzo è su un colore brand chiaro, scurisci il testo, non il brand.

**b) Link distinguibili solo dal colore** — *Links rely on color to be distinguishable*
Elementi: `nav.breadcrumb a`
→ Aggiungi `text-decoration: underline` (o un `border-bottom`) ai link del breadcrumb, oppure porta il contrasto link/testo circostante sopra 3:1 **e** aggiungi un indicatore non cromatico su `:hover`/`:focus`.

**c) Touch target troppo piccoli** — *Touch targets do not have sufficient size or spacing*
Elementi: `button.gallery-dot` (tutti i dot della galleria)
→ Minimo **24×24 px** di area cliccabile con almeno 24 px di spaziatura tra i centri. Il pallino può restare piccolo visivamente: ingrandisci l'area con `padding` o uno pseudo-elemento `::after` trasparente.

### P3.2 — `/SRC/compra-casa.html` e `/SRC/vendi-casa.html` (punteggio 96)

Contrasto insufficiente su:
- `p.contact-form-divider`
- il link dentro `section.final-cta`

→ Stesso trattamento: 4,5:1 minimo. Il divider ("oppure", "o ancora"?) è probabilmente grigio chiaro su bianco.

**Criteri di accettazione P3**
- Accessibility **100** su tutte le pagine.
- Nessuna regressione visiva sostanziale: i colori corretti devono restare coerenti con la palette. Se un colore brand non può raggiungere 4,5:1, proponi una variante scura da usare solo per il testo e chiedi conferma prima di applicarla ovunque.

---

## P4 — SEO e metadati

**`/index.html` è a 92** per un solo motivo: *Document does not have a meta description*.

```html
<meta name="description" content="…150-160 caratteri, con 'consulente immobiliare' e l'area geografica (Senigallia, Ancona)…">
```

Mentre ci sei, verifica su **tutte** le pagine la presenza di: `<title>` univoco, meta description univoca, `rel=canonical`, Open Graph. Le altre pagine passano già l'audit, ma Lighthouse non controlla l'unicità tra pagine — controllala tu.

**Criteri di accettazione P4:** SEO 100 su tutte le pagine, nessun `<title>` o description duplicata.

---

## P5 — JavaScript e main thread (solo `/index.html`)

`/index.html` è la pagina con più lavoro sul thread principale: **TBT 170 ms**, 5 long task, LCP 5,1 s.

**a) LCP element = `article.hero`.** Breakdown: TTFB 0 ms, *resource load delay* 70 ms, *element render delay* **210 ms**. Lighthouse chiede `fetchpriority=high` sull'immagine hero. Aggiungilo e assicurati che non sia `loading="lazy"`.

**b) Long task:**

| Script | Start | Durata |
|---|---|---|
| `/scripts/property-carousel.min.js` | 3.760 ms | **171 ms** |
| `/scripts/cookie-consent.min.js` | 3.931 ms | 85 ms |
| `/scripts/property-carousel.min.js` | 4.016 ms | 59 ms |
| Unattributable | 1.348 ms | 116 ms |
| Unattributable | 1.263 ms | 85 ms |

→ Carica entrambi con `defer`. Inizializza il carosello solo quando entra nel viewport (`IntersectionObserver`) invece che al `DOMContentLoaded`. Spezza l'init in chunk con `requestIdleCallback` se resta sopra i 50 ms.

**c) Forced reflow** — JS che legge proprietà geometriche dopo aver invalidato lo stile:

| Sorgente | Tempo di reflow |
|---|---|
| `property-carousel.min.js:1` | 84 ms |
| `index.html:1342` | 39 ms |
| `index.html:1221` | 39 ms |

→ Raggruppa tutte le letture (`offsetWidth`, `getBoundingClientRect`) **prima** di qualsiasi scrittura di stile, nel classico pattern read-then-write. Le righe 1221 e 1342 di `index.html` sono script inline: individuale e correggile.

**d) `index.html` pesa 116,2 KiB** perché contiene CSS e JS inline (Lighthouse rileva un blocco `inline: class ReviewsCarousel {…}` di 4,9 KiB, minificabile). Estrai la logica in file esterni con `defer` — tranne il CSS critico del P1, che resta inline di proposito.

**e) Immagini di brand su `index.html`:**
- `IMG/luigi-marinangeli-consulente-immobiliare-ancona-seniga….png` — 63,1 KiB, **è ancora PNG** → converti in WebP (risparmio stimato 35,7 KiB).
- `IMG/…-firma.svg` — 60,1 KiB per un SVG è enorme → passalo con SVGO.
- `IMG/luigi-marinangeli-consulente-immobiliare-senigallia-a….webp` — 206,8 KiB → applica il trattamento responsive del P0.

**f) DOM di 884 elementi, profondità 13** (le altre pagine stanno tra 121 e 291). Non è critico, ma se dopo gli altri interventi il TBT resta sopra i 150 ms, guarda qui: probabilmente ci sono liste renderizzate per intero che potrebbero essere paginate.

**g) `button#prevBtn.carousel-btn` ha un'animazione non compositata** (transizione su `color`). Sostituiscila con `opacity`/`transform`. Impatto minimo, fallo per ultimo.

**Criteri di accettazione P5**
- Performance mobile `/index.html` ≥ **90** (oggi 75).
- TBT < **150 ms**, LCP < **2,5 s**.
- Zero forced reflow segnalati.

---

## Protocollo di verifica

Dopo **ogni** blocco (non alla fine):

1. Rilancia Lighthouse su tutte e 6 le URL, in **modalità mobile** (Moto G Power, Slow 4G) — è la configurazione degli audit di riferimento, e quella dove il sito soffre.
2. Confronta con la tabella baseline in cima a questo file. Segnala ogni **regressione**, anche in una categoria diversa da quella su cui hai lavorato.
3. Verifica visivamente le pagine toccate a 375 px, 768 px e 1440 px prima di dichiarare chiuso un blocco.

## Regole operative

- **Non toccare i contenuti testuali**, i prezzi o i dati degli immobili. Solo markup, CSS, JS e asset.
- **Non introdurre dipendenze o build tool** senza chiedere prima: il progetto è statico e deve restare deployabile con un semplice upload.
- Gli script di generazione immagini vanno in `/tools/` e non devono finire in produzione.
- Se una correzione richiede una scelta di design (un colore brand che non raggiunge 4,5:1, la rimozione di un font), **fermati e chiedi** invece di decidere da solo.
- A fine lavoro produci un `REPORT-OTTIMIZZAZIONE.md` con: tabella prima/dopo dei punteggi, elenco dei file modificati, e la lista delle voci rimaste aperte perché dipendenti dall'hosting (compressione gzip/brotli, HTTP/2, cache header).
