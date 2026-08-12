/**
 * Buffer de pixels RGBA, estruturalmente compatível com o ImageData do
 * navegador (mesma forma: width, height, data). Definido à parte para o
 * núcleo de conversão não depender do DOM — assim dá para testar com
 * objetos simples, sem canvas nem jsdom.
 */
export interface PixelBuffer {
  width: number;
  height: number;
  /** RGBA, 4 bytes por pixel, comprimento = width * height * 4 */
  data: Uint8ClampedArray | Uint8Array;
}

export type Charset = 'ascii' | 'ascii-extended' | 'blocks' | 'braille';

export interface ConvertOptions {
  /** número de caracteres por linha na saída */
  columns: number;
  charset: Charset;
  /** -100..100, padrão 0 */
  brightness?: number;
  /** -100..100, padrão 0 */
  contrast?: number;
  /** inverte claro/escuro (equivale a um negativo em modo monocromático) */
  invert?: boolean;
  /** difusão de erro Floyd–Steinberg; padrão true */
  dithering?: boolean;
  /** razão altura/largura do glyph, usada pra corrigir a proporção da grade; padrão 2 */
  charAspect?: number;
}
