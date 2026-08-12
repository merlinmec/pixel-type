import type { ConvertOptions, PixelBuffer } from './types';
import { computeGrid } from './grid';
import { buildAdjustedValues } from './sampleValues';
import { quantizeGrid } from './dither';
import { RAMPS, type RampCharset } from './ramps';

export function convertRamp(buf: PixelBuffer, options: ConvertOptions): string {
  const ramp = RAMPS[options.charset as RampCharset];
  const n = ramp.length;
  const grid = computeGrid(buf.width, buf.height, options.columns, options.charAspect ?? 2);
  const values = buildAdjustedValues(buf, grid.columns, grid.rows, grid.cellWidth, grid.cellHeight, options);

  const toLevel = (v: number) => {
    const level = Math.min(n - 1, Math.max(0, Math.round(((255 - v) / 255) * (n - 1))));
    const value = 255 - (level / (n - 1)) * 255;
    return { level, value };
  };

  const levels = quantizeGrid(values, toLevel, options.dithering !== false);
  return levels.map((row) => row.map((lvl) => ramp[lvl]).join('')).join('\n');
}
