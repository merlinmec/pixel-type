import type { PixelBuffer } from './types';
import { rgbLuminance } from './luminance';

export interface Grid {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
}

/**
 * Calcula quantas linhas cabem para uma dada largura em colunas,
 * corrigindo a proporção do glyph (tipicamente ~2x mais alto que largo).
 * Sem essa correção o resultado sai esticado verticalmente.
 */
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

/** Luminância média dos pixels dentro do retângulo [x0,x1) x [y0,y1). */
export function sampleLuminance(
  buf: PixelBuffer,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): number {
  const xs = Math.max(0, Math.floor(x0));
  const xe = Math.min(buf.width, Math.max(xs + 1, Math.ceil(x1)));
  const ys = Math.max(0, Math.floor(y0));
  const ye = Math.min(buf.height, Math.max(ys + 1, Math.ceil(y1)));

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
