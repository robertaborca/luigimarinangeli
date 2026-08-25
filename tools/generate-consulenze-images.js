// Rigenera le 3 immagini delle card "Consulenze" in index.html dagli
// originali in REUSABLE IMGS/consulenze/ (stessa inquadratura/filtro,
// il file live era sovracompresso: ~4 KB per 465x225, artefatti visibili).
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const QUALITY = 74; // stessa qualita' usata da generate-responsive-images.js

const MAP = [
  { source: '1.png', target: 'IMG/luigi-marinangeli-consulente-immobiliare-consulenza-fast-per-la-vendita-immobile-a-senigallia-e-ancona.webp' },
  { source: '2.png', target: 'IMG/analisi-documentale-consulente-immobiliare-senigallia.webp' },
  { source: '3.png', target: 'IMG/luigi-marinangeli-consulente-immobiliare-consulenza-personalizzata-per-la-vendita-immobile-a-senigallia-e-ancona.webp' },
];

(async () => {
  for (const { source, target } of MAP) {
    const srcPath = path.join(ROOT, 'REUSABLE IMGS', 'consulenze', source);
    const targetPath = path.join(ROOT, target);
    const ext = path.extname(target);
    const base400Path = path.join(ROOT, target.slice(0, -ext.length) + '-400' + ext);

    const meta = await sharp(srcPath).metadata();
    if (meta.width !== 465 || meta.height !== 225) {
      console.error(`ATTENZIONE: ${source} e' ${meta.width}x${meta.height}, atteso 465x225`);
    }

    await sharp(srcPath).webp({ quality: QUALITY }).toFile(targetPath);
    await sharp(srcPath).resize({ width: 400 }).webp({ quality: QUALITY }).toFile(base400Path);

    const bytesBase = fs.statSync(targetPath).size;
    const bytes400 = fs.statSync(base400Path).size;
    console.log(`${path.basename(target)}: ${(bytesBase/1024).toFixed(1)} KB`);
    console.log(`${path.basename(base400Path)}: ${(bytes400/1024).toFixed(1)} KB`);
  }
})();
