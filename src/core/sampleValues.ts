import type { ConvertOptions, PixelBuffer } from './types';
import { sampleLuminance } from './grid';
import { adjustBrightnessContrast } from './luminance';
import { normalizeLevels } from './levels';

export function buildAdjustedValues(
  buf: PixelBuffer,
  cols: number,
  rows: number,
  cellWidth: number,
  cellHeight: number,
  options: ConvertOptions,
): number[][] {
  const values: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const x0 = c * cellWidth;
      const y0 = r * cellHeight;
      row.push(sampleLuminance(buf, x0, x0 + cellWidth, y0, y0 + cellHeight));
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

  return values;
}
