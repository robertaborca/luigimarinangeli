// Rigenera IMG/...--mobile.webp ritagliando dal file DESKTOP gia' in
// produzione (stessa luce/colore, nessuna correzione da indovinare),
// invece che ripartire dal file 500x700 esistente o dal JPEG grezzo
// (che ha un'esposizione diversa, non corretta in post-produzione).
const sharp = require('sharp');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'IMG', 'luigi-marinangeli-consulente-immobiliare-senigallia-ancona.webp');
const OUT = path.join(ROOT, 'IMG', 'luigi-marinangeli-consulente-immobiliare-senigallia-ancona--mobile.webp');

// Ritaglio verticale dal lato destro: il soggetto e' a destra nella foto
// desktop 1600x1202, quindi tenere gli 858px di destra preserva soggetto
// e cartella e lascia muro a sinistra per il testo della hero.
const CROP_WIDTH = 858;
const CROP_HEIGHT = 1202;

(async () => {
  const meta = await sharp(SOURCE).metadata();
  if (meta.width !== 1600 || meta.height !== 1202) {
    console.error(`Sorgente inattesa: ${meta.width}x${meta.height}, attesi 1600x1202`);
    process.exit(1);
  }
  await sharp(SOURCE)
    .extract({ left: meta.width - CROP_WIDTH, top: 0, width: CROP_WIDTH, height: CROP_HEIGHT })
    .webp({ quality: 80 })
    .toFile(OUT);

  const out = await sharp(OUT).metadata();
  const fs = require('fs');
  const bytes = fs.statSync(OUT).size;
  console.log(`OK: ${OUT}`);
  console.log(`${out.width}x${out.height}, ${(bytes / 1024).toFixed(1)} KB`);
})();
