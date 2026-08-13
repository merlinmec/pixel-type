import type { ConvertOptions, PixelBuffer } from './types';
import { computeGrid } from './grid';
import { buildAdjustedValues } from './sampleValues';
import { quantizeGrid } from './dither';
import { RAMPS } from './ramps';

// Kernels de Sobel: detectam o gradiente de luminância em cada célula da
// grade (não em cada pixel — a grade já é a resolução do texto final).
const GX = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];
const GY = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

/**
 * Converte usando contorno: onde a imagem tem uma borda nítida, desenha um
 * traço orientado (-, |, /, \) em vez de um caractere de sombreado. É o que
 * faz o resultado "parecer" a imagem original — o olho reconhece contornos
 * muito mais rápido do que gradientes de densidade.
 */
export function convertEdges(buf: PixelBuffer, options: ConvertOptions): string {
  const ramp = RAMPS.ascii;
  const n = ramp.length;
  const grid = computeGrid(buf.width, buf.height, options.columns, options.charAspect ?? 2);
  const { columns: cols, rows } = grid;
  const values = buildAdjustedValues(buf, cols, rows, grid.cellWidth, grid.cellHeight, options);

  // Precisamos do valor "cru" pra calcular o gradiente antes que o dithering
  // (mais abaixo) espalhe erro entre células vizinhas e distorça as bordas.
  const source = values.map((row) => row.slice());
  const at = (r: number, c: number) =>
    source[Math.min(rows - 1, Math.max(0, r))][Math.min(cols - 1, Math.max(0, c))];

  const magnitude: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const direction: string[][] = Array.from({ length: rows }, () => new Array(cols).fill('-'));
  let maxMagnitude = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let gx = 0;
      let gy = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = at(r + dy, c + dx);
          gx += v * GX[dy + 1][dx + 1];
          gy += v * GY[dy + 1][dx + 1];
        }
      }
      const m = Math.hypot(gx, gy);
      magnitude[r][c] = m;
      if (m > maxMagnitude) maxMagnitude = m;

      // Ângulo do gradiente, normalizado pra 0–180° (a direção do traço é a
      // mesma nos dois sentidos de uma borda). Cada faixa de 45° vira um char.
      const angle = (Math.atan2(gy, gx) * 180) / Math.PI;
      const norm = ((angle % 180) + 180) % 180;
      if (norm < 22.5 || norm >= 157.5) direction[r][c] = '|';
      else if (norm < 67.5) direction[r][c] = '/';
      else if (norm < 112.5) direction[r][c] = '-';
      else direction[r][c] = '\\';
    }
  }

  // Limiar relativo ao contraste da própria imagem, com piso absoluto pra
  // não transformar ruído de imagens muito planas em bordas falsas.
  const threshold = Math.max(24, maxMagnitude * 0.22);

  const toLevel = (v: number) => {
    const level = Math.min(n - 1, Math.max(0, Math.round(((255 - v) / 255) * (n - 1))));
    const value = 255 - (level / (n - 1)) * 255;
    return { level, value };
  };
  const levels = quantizeGrid(values, toLevel, options.dithering !== false);

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      line += magnitude[r][c] >= threshold ? direction[r][c] : ramp[levels[r][c]];
    }
    lines.push(line);
  }
  return lines.join('\n');
}
