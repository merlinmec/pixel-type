import type { ConvertOptions, PixelBuffer } from './types';
import { convertRamp } from './convertRamp';
import { convertBraille } from './convertBraille';
import { convertEdges } from './convertEdges';

export function convertToText(buf: PixelBuffer, options: ConvertOptions): string {
  if (options.columns < 1) throw new Error('columns deve ser >= 1');
  if (buf.width < 1 || buf.height < 1) throw new Error('imagem vazia');

  if (options.charset === 'braille') return convertBraille(buf, options);
  if (options.charset === 'edges') return convertEdges(buf, options);
  return convertRamp(buf, options);
}

export type { ConvertOptions, Charset, PixelBuffer } from './types';
export { RAMPS } from './ramps';
