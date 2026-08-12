import type { ConvertOptions, PixelBuffer } from './types';
import { computeGrid, sampleLuminance } from './grid';
import { adjustBrightnessContrast } from './luminance';
import { normalizeLevels } from './levels';
import { quantizeGrid } from './dither';
import { RAMPS, type RampCharset } from './ramps';

export function convertRamp(buf: PixelBuffer, options: ConvertOptions): string {
  const ramp = RAMPS[options.charset as RampCharset];
  const n = ramp.length;
  const grid = computeGrid(buf.width, buf.height, options.columns, options.charAspect ?? 2);

  const values: number[][] = [];
  for (let r = 0; r < grid.rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < grid.columns; c++) {
      const x0 = c * grid.cellWidth;
      const y0 = r * grid.cellHeight;
      row.push(sampleLuminance(buf, x0, x0 + grid.cellWidth, y0, y0 + grid.cellHeight));
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

  const toLevel = (v: number) => {
    const level = Math.min(n - 1, Math.max(0, Math.round(((255 - v) / 255) * (n - 1))));
    const value = 255 - (level / (n - 1)) * 255;
    return { level, value };
  };

  const levels = quantizeGrid(values, toLevel, options.dithering !== false);
  return levels.map((row) => row.map((lvl) => ramp[lvl]).join('')).join('\n');
}
