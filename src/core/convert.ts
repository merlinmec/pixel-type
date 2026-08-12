import type { ConvertOptions, PixelBuffer } from './types';
import { convertRamp } from './convertRamp';
import { convertBraille } from './convertBraille';

/**
 * Ponto de entrada do núcleo: imagem (pixels) + opções -> texto puro.
 * Sem dependência de DOM — funciona igual no navegador, em Node ou em testes.
 */
export function convertToText(buf: PixelBuffer, options: ConvertOptions): string {
  if (options.columns < 1) throw new Error('columns deve ser >= 1');
  if (buf.width < 1 || buf.height < 1) throw new Error('imagem vazia');

  return options.charset === 'braille' ? convertBraille(buf, options) : convertRamp(buf, options);
}

export type { ConvertOptions, Charset, PixelBuffer } from './types';
export { RAMPS } from './ramps';
