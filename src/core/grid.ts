import type { PixelBuffer } from './types';
import { rgbLuminance } from './luminance';

export interface Grid {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
}

export function computeGrid(
  width: number,
  height: number,
  columns: number,
  charAspect = 2,
): Grid {
  const safeColumns = Math.max(1, Math.floor(columns));
  const cellWidth = width / safeColumns;
  const rows = Math.max(1, Math.round(height / cellWidth / charAspect));
  const cellHeight = height / rows;
  return { columns: safeColumns, rows, cellWidth, cellHeight };
}

export function sampleLuminance(
  buf: PixelBuffer,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): number {
  // `round` nos dois limites (não `floor` no início + `ceil` no fim): quando
  // o tamanho da célula não é inteiro, x1 desta célula é o mesmo valor
  // fracionário que x0 da próxima — arredondar os dois do mesmo jeito faz o
  // fim de uma bater exatamente com o início da outra. Com floor/ceil
  // independentes, esse pixel de fronteira entrava nas duas células.
  const xs = Math.max(0, Math.round(x0));
  const xe = Math.min(buf.width, Math.max(xs + 1, Math.round(x1)));
  const ys = Math.max(0, Math.round(y0));
  const ye = Math.min(buf.height, Math.max(ys + 1, Math.round(y1)));

  let sum = 0;
  let count = 0;
  for (let y = ys; y < ye; y++) {
    for (let x = xs; x < xe; x++) {
      const i = (y * buf.width + x) * 4;
      sum += rgbLuminance(buf.data[i], buf.data[i + 1], buf.data[i + 2]);
      count++;
    }
  }
  return count > 0 ? sum / count : 255;
}
