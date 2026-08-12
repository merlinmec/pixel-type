import { describe, expect, it } from 'vitest';
import { normalizeLevels } from './levels';

describe('normalizeLevels', () => {
  it('estica um intervalo estreito para cobrir 0..255', () => {
    const values = [
      [100, 110, 120],
      [130, 140, 150],
    ];
    normalizeLevels(values);
    const flat = values.flat();
    expect(Math.min(...flat)).toBeCloseTo(0, 5);
    expect(Math.max(...flat)).toBeCloseTo(255, 5);
  });

  it('não altera uma imagem totalmente uniforme', () => {
    const values = [
      [128, 128],
      [128, 128],
    ];
    normalizeLevels(values);
    expect(values).toEqual([
      [128, 128],
      [128, 128],
    ]);
  });
});
