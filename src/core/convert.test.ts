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

describe('convertToText — validação', () => {
  it('rejeita columns menor que 1', () => {
    const buf = makeSolidBuffer(4, 4, [0, 0, 0]);
    expect(() => convertToText(buf, { columns: 0, charset: 'ascii' })).toThrow();
  });
});
