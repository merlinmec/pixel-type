import { describe, expect, it } from 'vitest';
import { convertToText } from './convert';
import { computeGrid, sampleLuminance } from './grid';
import { RAMPS } from './ramps';
import type { PixelBuffer } from './types';

function makeSolidBuffer(width: number, height: number, [r, g, b]: [number, number, number]): PixelBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

describe('computeGrid', () => {
  it('corrige a proporção do glyph ao calcular as linhas', () => {
    const grid = computeGrid(100, 50, 20, 2);
    expect(grid.columns).toBe(20);
    expect(grid.cellWidth).toBe(5);
    expect(grid.rows).toBe(5);
  });

  it('nunca produz menos de 1 linha', () => {
    const grid = computeGrid(10, 1, 50, 2);
    expect(grid.rows).toBeGreaterThanOrEqual(1);
  });
});

describe('sampleLuminance', () => {
  it('calcula a luminância média de um bloco sólido', () => {
    const buf = makeSolidBuffer(4, 4, [255, 255, 255]);
    expect(sampleLuminance(buf, 0, 4, 0, 4)).toBeCloseTo(255, 5);
  });

  it('pesa verde mais que azul (luminância perceptual)', () => {
    const green = makeSolidBuffer(2, 2, [0, 255, 0]);
    const blue = makeSolidBuffer(2, 2, [0, 0, 255]);
    expect(sampleLuminance(green, 0, 2, 0, 2)).toBeGreaterThan(sampleLuminance(blue, 0, 2, 0, 2));
  });

  it('não conta o pixel de fronteira em duas células quando o limite é fracionário', () => {
    // 10 pixels numa linha, luminância crescente = índice do pixel — dá pra
    // conferir exatamente quais índices cada amostra está somando.
    const width = 10;
    const data = new Uint8ClampedArray(width * 4);
    for (let x = 0; x < width; x++) {
      data[x * 4] = x; // R = índice; G = B = 0, então luminância = 0.299 * x
      data[x * 4 + 3] = 255;
    }
    const buf: PixelBuffer = { width, height: 1, data };

    // 3 colunas sobre 10 pixels -> cellWidth = 10/3 (fracionário de propósito).
    const cellWidth = width / 3;
    const meanOf = (indices: number[]) =>
      indices.reduce((sum, i) => sum + 0.299 * i, 0) / indices.length;

    const cell0 = sampleLuminance(buf, 0, cellWidth, 0, 1);
    const cell1 = sampleLuminance(buf, cellWidth, cellWidth * 2, 0, 1);

    // Antes do fix (floor no início + ceil no fim), a célula 0 também
    // pegava o pixel 3 (que pertence à célula 1), inflando essa média.
    expect(cell0).toBeCloseTo(meanOf([0, 1, 2]), 5);
    expect(cell1).toBeCloseTo(meanOf([3, 4, 5, 6]), 5);
  });
});

describe('convertToText — rampa (ascii/blocks)', () => {
  it('imagem branca sólida vira o caractere mais esparso da rampa', () => {
    const buf = makeSolidBuffer(40, 40, [255, 255, 255]);
    const text = convertToText(buf, { columns: 10, charset: 'ascii', dithering: false });
    const chars = new Set(text.replace(/\n/g, ''));
    expect(chars).toEqual(new Set([RAMPS.ascii[0]]));
  });

  it('imagem preta sólida vira o caractere mais denso da rampa', () => {
    const buf = makeSolidBuffer(40, 40, [0, 0, 0]);
    const text = convertToText(buf, { columns: 10, charset: 'ascii', dithering: false });
    const chars = new Set(text.replace(/\n/g, ''));
    expect(chars).toEqual(new Set([RAMPS.ascii[RAMPS.ascii.length - 1]]));
  });

  it('invert troca claro por escuro', () => {
    const buf = makeSolidBuffer(40, 40, [0, 0, 0]);
    const text = convertToText(buf, { columns: 10, charset: 'ascii', dithering: false, invert: true });
    const chars = new Set(text.replace(/\n/g, ''));
    expect(chars).toEqual(new Set([RAMPS.ascii[0]]));
  });

  it('produz o número de linhas e colunas esperado', () => {
    const buf = makeSolidBuffer(100, 50, [128, 128, 128]);
    const text = convertToText(buf, { columns: 20, charset: 'ascii', dithering: false, charAspect: 2 });
    const lines = text.split('\n');
    expect(lines).toHaveLength(5);
    expect(lines.every((line) => line.length === 20)).toBe(true);
  });
});

describe('convertToText — braille', () => {
  it('imagem preta sólida acende todos os pontos (U+28FF)', () => {
    const buf = makeSolidBuffer(32, 32, [0, 0, 0]);
    const text = convertToText(buf, { columns: 8, charset: 'braille', dithering: false });
    const chars = [...text.replace(/\n/g, '')];
    expect(chars.every((ch) => ch.codePointAt(0) === 0x28ff)).toBe(true);
  });

  it('imagem branca sólida não acende nenhum ponto (U+2800)', () => {
    const buf = makeSolidBuffer(32, 32, [255, 255, 255]);
    const text = convertToText(buf, { columns: 8, charset: 'braille', dithering: false });
    const chars = [...text.replace(/\n/g, '')];
    expect(chars.every((ch) => ch.codePointAt(0) === 0x2800)).toBe(true);
  });
});

describe('convertToText — bordas (edges)', () => {
  it('imagem sólida (sem borda) cai inteiramente na rampa', () => {
    const buf = makeSolidBuffer(40, 40, [255, 255, 255]);
    const text = convertToText(buf, { columns: 10, charset: 'edges', dithering: false });
    const chars = new Set(text.replace(/\n/g, ''));
    expect(chars).toEqual(new Set([RAMPS.ascii[0]]));
  });

  it('detecta uma borda nítida e desenha um traço orientado', () => {
    const width = 40;
    const height = 40;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const v = x < width / 2 ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
    const buf: PixelBuffer = { width, height, data };
    const text = convertToText(buf, { columns: 10, charset: 'edges', dithering: false, autoLevels: false });
    const hasEdgeChar = [...text].some((ch) => '-|/\\'.includes(ch));
    expect(hasEdgeChar).toBe(true);
  });
});

describe('convertToText — validação', () => {
  it('rejeita columns menor que 1', () => {
    const buf = makeSolidBuffer(4, 4, [0, 0, 0]);
    expect(() => convertToText(buf, { columns: 0, charset: 'ascii' })).toThrow();
  });
});
