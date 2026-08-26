// Genera le immagini Open Graph (1200x630) per gli articoli del blog.
// Uso: node tools/generate-og-images.mjs [slug1 slug2 ...]
//   Senza argomenti genera tutti gli articoli elencati in ARTICLES.
//
// Per aggiungere un nuovo articolo basta aggiungere una riga all'array
// ARTICLES qui sotto: { slug, category, title }.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const fontkit = require('fontkit');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const OUT_DIR = path.join(ROOT, 'IMG', 'OG');
const SUSE_FONT_PATH = path.join(ROOT, 'CSS', 'fonts', 'suse.woff2');
const MONTSERRAT_FONT_PATH = path.join(ROOT, 'CSS', 'fonts', 'montserrat.woff2');
const FIRMA_SVG_PATH = path.join(
  ROOT,
  'IMG',
  'luigi-marinangeli-consulente-immobiliare-ancona-firma.svg'
);

const W = 1200;
const H = 630;

const COLORS = {
  bg: '#FFFFFF',
  ink: '#355F6F',
  gold: '#B0894A',
  houseWatermark: '#E6E6E6',
};

// Cornice, dal bordo dell'immagine verso l'interno:
//   18px margine bianco, 16px filo #355F6F, 24px stacco bianco, 3px
//   filetto oro. Il contenuto deve avere almeno 44px di respiro dal
//   filetto oro, quindi l'area utile e' rientrata di 105px per lato.
const FRAME_WHITE_MARGIN = 18;
const FRAME_BORDER_WIDTH = 16;
const FRAME_GAP = 24;
const FRAME_HAIRLINE_WIDTH = 3;
const CONTENT_SAFETY_GAP = 44;
const CONTENT_MARGIN =
  FRAME_WHITE_MARGIN + FRAME_BORDER_WIDTH + FRAME_GAP + FRAME_HAIRLINE_WIDTH + CONTENT_SAFETY_GAP; // 105

const CONTENT_LEFT = CONTENT_MARGIN;
const CONTENT_RIGHT = W - CONTENT_MARGIN;
const CONTENT_TOP = CONTENT_MARGIN;
const CONTENT_BOTTOM = H - CONTENT_MARGIN;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

const TITLE_MAX_WIDTH = CONTENT_WIDTH;
const TITLE_MAX_LINES = 3;
const TITLE_LINE_HEIGHT_RATIO = 1.3;
const TITLE_FONT_MAX = 62;
const TITLE_FONT_MIN = 44;
const TITLE_FONT_STEP = 2;

const CATEGORY_FONT_SIZE = 23;
const CATEGORY_TO_DASH_GAP = 16;
const DASH_HEIGHT = 3;
const DASH_WIDTH = 62;
const DASH_TO_TITLE_GAP = 30;

// Piede: firma in basso a sinistra, "lecasediluigi.com" in basso a
// destra, ancorati a CONTENT_BOTTOM; sopra, la linea di separazione.
const FOOTER_SIGNATURE_WIDTH = 195;
const FOOTER_SIGNATURE_HEIGHT = 65; // 3:1, stesso rapporto dell'SVG originale (180x60)
const FOOTER_SEPARATOR_GAP = 24; // spazio tra la linea e il blocco firma/url
const FOOTER_SIGNATURE_TOP = CONTENT_BOTTOM - FOOTER_SIGNATURE_HEIGHT;
const FOOTER_SEPARATOR_Y = FOOTER_SIGNATURE_TOP - FOOTER_SEPARATOR_GAP;
const FOOTER_SITE_BASELINE_Y = CONTENT_BOTTOM - 8;

// Il blocco categoria+titolo e' centrato sulla mezzeria della card, ma
// non puo' scendere sotto questa soglia (44px sopra la linea del piede).
const BLOCK_MAX_BOTTOM = FOOTER_SEPARATOR_Y - CONTENT_SAFETY_GAP;

// SUSE e' un font variabile il cui asse wght non si limita a infittire i
// tratti: oltre ~680 gli spuntano le grazie (diventa un serif "da
// libro"), mentre sotto quella soglia resta bastone. La spec chiede
// esplicitamente il font serif del sito per il titolo, quindi qui si
// resta sopra quella soglia.
const TITLE_FONT_WEIGHT = 700;

// La misura qui sotto usa l'istanza di default del font (peso 100) come
// approssimazione delle larghezze al peso reale scelto sopra, quindi
// applichiamo un margine di sicurezza per non rischiare overflow quando
// il testo viene reso davvero a TITLE_FONT_WEIGHT.
const BOLD_WIDTH_SAFETY = 1.06;

const suseFont = fontkit.openSync(SUSE_FONT_PATH);
const suseFontB64 = fs.readFileSync(SUSE_FONT_PATH).toString('base64');
const montserratFontB64 = fs.readFileSync(MONTSERRAT_FONT_PATH).toString('base64');

function measureWidth(text, fontSize) {
  const run = suseFont.layout(text);
  return (run.advanceWidth / suseFont.unitsPerEm) * fontSize * BOLD_WIDTH_SAFETY;
}

function wrapTitle(title, fontSize, maxWidth) {
  const words = title.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureWidth(candidate, fontSize) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitTitle(title) {
  for (let fontSize = TITLE_FONT_MAX; fontSize >= TITLE_FONT_MIN; fontSize -= TITLE_FONT_STEP) {
    const lines = wrapTitle(title, fontSize, TITLE_MAX_WIDTH);
    if (lines.length <= TITLE_MAX_LINES) {
      return { fontSize, lines };
    }
  }
  // Caso limite: usa comunque la dimensione minima, anche a costo di
  // eccedere leggermente le 3 righe.
  return { fontSize: TITLE_FONT_MIN, lines: wrapTitle(title, TITLE_FONT_MIN, TITLE_MAX_WIDTH) };
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTitleTspans(lines, fontSize) {
  const lineHeight = fontSize * TITLE_LINE_HEIGHT_RATIO;
  return lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : lineHeight;
      return `<tspan x="${CONTENT_LEFT}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');
}

function buildFrame() {
  // Ogni anello e' un rect il cui tracciato passa per la mezzeria della
  // fascia desiderata, cosi' che lo stroke la riempia esattamente.
  const borderCenter = FRAME_WHITE_MARGIN + FRAME_BORDER_WIDTH / 2;
  const hairlineCenter =
    FRAME_WHITE_MARGIN + FRAME_BORDER_WIDTH + FRAME_GAP + FRAME_HAIRLINE_WIDTH / 2;

  return `
    <rect x="${borderCenter}" y="${borderCenter}" width="${W - 2 * borderCenter}" height="${H - 2 * borderCenter}" fill="none" stroke="${COLORS.ink}" stroke-width="${FRAME_BORDER_WIDTH}" />
    <rect x="${hairlineCenter}" y="${hairlineCenter}" width="${W - 2 * hairlineCenter}" height="${H - 2 * hairlineCenter}" fill="none" stroke="${COLORS.gold}" stroke-width="${FRAME_HAIRLINE_WIDTH}" />`;
}

function buildHouseIcon() {
  // Sagoma di una casa, usata come filigrana dietro al blocco
  // categoria+titolo (disegnata prima del testo, quindi resta sotto).
  const centerX = 600;
  const roofWidth = 520;
  const roofHeight = 200;
  const apexY = 130;
  const bodyInset = 80;
  const bodyOverlap = 18;
  const bodyHeight = 170;

  const ox = centerX - roofWidth / 2;
  const eavesY = apexY + roofHeight;
  const bodyTop = eavesY - bodyOverlap;
  const bodyBottom = bodyTop + bodyHeight;
  const bodyLeft = ox + bodyInset;
  const bodyRight = ox + roofWidth - bodyInset;

  return `
    <g stroke="${COLORS.houseWatermark}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <path d="M ${ox} ${eavesY} L ${centerX} ${apexY} L ${ox + roofWidth} ${eavesY}" />
      <path d="M ${bodyLeft} ${bodyTop} L ${bodyLeft} ${bodyBottom} L ${bodyRight} ${bodyBottom} L ${bodyRight} ${bodyTop}" />
    </g>`;
}

function buildCardSvg(article) {
  const { category, title } = article;
  const { fontSize, lines } = fitTitle(title);
  const titleTspans = buildTitleTspans(lines, fontSize);

  // Altezza visiva del blocco categoria + trattino + titolo, per
  // poterlo centrare sulla mezzeria della card.
  const lineHeight = fontSize * TITLE_LINE_HEIGHT_RATIO;
  const titleVisualHeight = fontSize + (lines.length - 1) * lineHeight;
  const blockHeight =
    CATEGORY_FONT_SIZE + CATEGORY_TO_DASH_GAP + DASH_HEIGHT + DASH_TO_TITLE_GAP + titleVisualHeight;

  let blockTop = H / 2 - blockHeight / 2;
  const blockBottom = blockTop + blockHeight;
  if (blockBottom > BLOCK_MAX_BOTTOM) {
    blockTop -= blockBottom - BLOCK_MAX_BOTTOM;
  }

  const categoryBaselineY = blockTop + CATEGORY_FONT_SIZE * 0.8;
  const dashY = blockTop + CATEGORY_FONT_SIZE + CATEGORY_TO_DASH_GAP;
  const titleFirstBaselineY = dashY + DASH_HEIGHT + DASH_TO_TITLE_GAP + fontSize * 0.8;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      @font-face {
        font-family: 'SUSE';
        font-weight: 100 800;
        src: url(data:font/woff2;base64,${suseFontB64}) format('woff2');
      }
      @font-face {
        font-family: 'Montserrat';
        font-weight: 100 900;
        src: url(data:font/woff2;base64,${montserratFontB64}) format('woff2');
      }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="${COLORS.bg}" />

  ${buildHouseIcon()}
  ${buildFrame()}

  <text x="${CONTENT_LEFT}" y="${categoryBaselineY}" font-family="Montserrat" font-weight="700" font-size="${CATEGORY_FONT_SIZE}" letter-spacing="3" fill="${COLORS.ink}">${escapeXml(category.toUpperCase())}</text>
  <rect x="${CONTENT_LEFT}" y="${dashY}" width="${DASH_WIDTH}" height="${DASH_HEIGHT}" fill="${COLORS.ink}" />

  <text x="${CONTENT_LEFT}" y="${titleFirstBaselineY}" font-family="SUSE" font-weight="${TITLE_FONT_WEIGHT}" font-size="${fontSize}" fill="${COLORS.ink}">${titleTspans}</text>

  <text x="${CONTENT_RIGHT}" y="${FOOTER_SITE_BASELINE_Y}" text-anchor="end" font-family="Montserrat" font-weight="500" font-size="21" fill="${COLORS.ink}">lecasediluigi.com</text>
</svg>`;
}

async function renderArticle(article) {
  const cardSvg = buildCardSvg(article);
  // La firma e' pensata per stare su sfondo bianco: qui il fondo carta e'
  // bianco, quindi va usata cosi' com'e', senza ricolorarla.
  const firmaSvg = fs.readFileSync(FIRMA_SVG_PATH, 'utf8');

  const firmaBuffer = await sharp(Buffer.from(firmaSvg), { density: 300 })
    .resize(FOOTER_SIGNATURE_WIDTH, FOOTER_SIGNATURE_HEIGHT)
    .png()
    .toBuffer();

  const firmaX = CONTENT_LEFT;
  const firmaY = FOOTER_SIGNATURE_TOP;

  const outPath = path.join(OUT_DIR, `og-${article.slug}.jpg`);

  await sharp(Buffer.from(cardSvg))
    .composite([{ input: firmaBuffer, left: firmaX, top: firmaY }])
    .jpeg({ quality: 86, progressive: true, mozjpeg: true })
    .toFile(outPath);

  const { size } = fs.statSync(outPath);
  console.log(`OK  og-${article.slug}.jpg  ${(size / 1024).toFixed(1)} KB`);
}

const ARTICLES = [
  {
    slug: 'vendere-casa-guida-passo-passo',
    category: 'Guida alla vendita',
    title: 'Vendere casa: la guida passo passo',
  },
  {
    slug: 'documenti-necessari-per-comprare-casa',
    category: 'Guida all’acquisto',
    title: 'Documenti per comprare casa: la checklist',
  },
  {
    slug: 'quanto-costa-vendere-casa-tasse-e-spese',
    category: 'Costi e tasse',
    title: 'Quanto costa vendere casa',
  },
  {
    slug: 'compromesso-e-rogito-differenze',
    category: 'Aspetti legali',
    title: 'Compromesso e rogito: le differenze',
  },
  {
    slug: 'comprare-casa-da-ristrutturare-vantaggi-e-rischi',
    category: 'Guida all’acquisto',
    title: 'Comprare casa da ristrutturare: vantaggi e rischi',
  },
  {
    slug: 'guida-ai-quartieri-di-senigallia-dove-comprare-casa',
    category: 'Zone e quartieri',
    title: 'Le zone di Senigallia: guida ai quartieri',
  },
  {
    slug: 'mutuo-casa-come-funziona-cosa-serve',
    category: 'Consulenza mutui',
    title: 'Mutuo casa: come funziona e cosa serve',
  },
  {
    slug: 'attestato-prestazione-energetica-ape-cosa-serve',
    category: 'Documenti e certificazioni',
    title: 'APE: cos’è e perché serve',
  },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const requested = process.argv.slice(2);
  const toRender = requested.length
    ? ARTICLES.filter((a) => requested.includes(a.slug))
    : ARTICLES;

  if (!toRender.length) {
    console.error('Nessun articolo trovato per gli slug indicati.');
    process.exit(1);
  }

  for (const article of toRender) {
    await renderArticle(article);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
