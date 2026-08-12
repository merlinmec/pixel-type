import type { ConvertOptions, PixelBuffer } from './types';
import { computeGrid, sampleLuminance } from './grid';
import { adjustBrightnessContrast } from './luminance';
import { normalizeLevels } from './levels';
import { quantizeGrid } from './dither';

const BIT_FOR_DOT: readonly [number, number][] = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

export function convertBraille(buf: PixelBuffer, options: ConvertOptions): string {
  const grid = computeGrid(buf.width, buf.height, options.columns, options.charAspect ?? 2);
  const dotCols = grid.columns * 2;
  const dotRows = grid.rows * 4;
  const dotWidth = grid.cellWidth / 2;
  const dotHeight = grid.cellHeight / 4;

  const values: number[][] = [];
  for (let dr = 0; dr < dotRows; dr++) {
    const row: number[] = [];
    for (let dc = 0; dc < dotCols; dc++) {
      const x0 = dc * dotWidth;
      const y0 = dr * dotHeight;
      row.push(sampleLuminance(buf, x0, x0 + dotWidth, y0, y0 + dotHeight));
    }
    values.push(row);
  }

  if (options.autoLevels !== false) normalizeLevels(values);

  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      let v = adjustBrightnessContrast(values[r][c], options.brightness ?? 0, options.contrast ?? 0);
      if (options.invert) v = 255 - v;
      values[r][c] = v;
    }
  }

  const toLevel = (v: number) => (v < 128 ? { level: 1, value: 0 } : { level: 0, value: 255 });
  const dots = quantizeGrid(values, toLevel, options.dithering !== false);

  const lines: string[] = [];
  for (let r = 0; r < grid.rows; r++) {
    let line = '';
    for (let c = 0; c < grid.columns; c++) {
      let bits = 0;
      const dr0 = r * 4;
      const dc0 = c * 2;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (dots[dr0 + dy][dc0 + dx]) bits |= BIT_FOR_DOT[dy][dx];
        }
      }
      line += String.fromCodePoint(0x2800 + bits);
    }
    lines.push(line);
  }
  return lines.join('\n');
}
