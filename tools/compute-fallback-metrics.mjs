import { fromBuffer } from '@capsizecss/unpack';
import path from 'path';
import { readFile } from 'fs/promises';

const ROOT = path.resolve(import.meta.dirname, '..');

async function metricsFor(fontPath, label) {
  const buf = await readFile(path.join(ROOT, fontPath));
  const metrics = await fromBuffer(buf);
  console.log(`--- ${label} ---`);
  console.log(JSON.stringify(metrics, null, 1));
  return metrics;
}

const montserrat = await metricsFor('CSS/fonts/montserrat.woff2', 'Montserrat');
const suse = await metricsFor('CSS/fonts/suse.woff2', 'SUSE');

// Arial metrics are well-known/built into capsizecss's font family metrics list under 'arial'
const arialModule = await import('@capsizecss/metrics/arial');
const arial = arialModule.default;
console.log('--- Arial (fallback) ---');
console.log(JSON.stringify(arial, null, 1));

function computeOverride(metrics, fallback) {
  const capHeightScale = metrics.capHeight / metrics.unitsPerEm;
  const fallbackCapHeightScale = fallback.capHeight / fallback.unitsPerEm;
  const sizeAdjust = capHeightScale / fallbackCapHeightScale;
  const ascentOverride = (metrics.ascent / metrics.unitsPerEm) / sizeAdjust;
  const descentOverride = Math.abs(metrics.descent / metrics.unitsPerEm) / sizeAdjust;
  const lineGapOverride = (metrics.lineGap / metrics.unitsPerEm) / sizeAdjust;
  return {
    sizeAdjust: (sizeAdjust * 100).toFixed(2) + '%',
    ascentOverride: (ascentOverride * 100).toFixed(2) + '%',
    descentOverride: (descentOverride * 100).toFixed(2) + '%',
    lineGapOverride: (lineGapOverride * 100).toFixed(2) + '%',
  };
}

console.log('\n=== Montserrat fallback override (vs Arial) ===');
console.log(computeOverride(montserrat, arial));
console.log('\n=== SUSE fallback override (vs Arial) ===');
console.log(computeOverride(suse, arial));
