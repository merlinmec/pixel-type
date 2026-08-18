import type { ConvertOptions, PixelBuffer } from './types';
import { computeGrid } from './grid';
import { buildAdjustedValues } from './sampleValues';
import { quantizeGrid } from './dither';
import { RAMPS, rampQuantizer, type RampCharset } from './ramps';

export function convertRamp(buf: PixelBuffer, options: ConvertOptions): string {
  const ramp = RAMPS[options.charset as RampCharset];
  const grid = computeGrid(buf.width, buf.height, options.columns, options.charAspect ?? 2);
  const values = buildAdjustedValues(buf, grid.columns, grid.rows, grid.cellWidth, grid.cellHeight, options);

  const toLevel = rampQuantizer(ramp);

  const levels = quantizeGrid(values, toLevel, options.dithering !== false);
  return levels.map((row) => row.map((lvl) => ramp[lvl]).join('')).join('\n');
}
