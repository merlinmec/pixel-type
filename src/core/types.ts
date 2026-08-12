export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}

export type Charset = 'ascii' | 'ascii-extended' | 'blocks' | 'braille';

export interface ConvertOptions {
  columns: number;
  charset: Charset;
  brightness?: number;
  contrast?: number;
  invert?: boolean;
  dithering?: boolean;
  autoLevels?: boolean;
  charAspect?: number;
}
