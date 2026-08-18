import type { ConvertOptions, PixelBuffer } from './types';
import { computeGrid } from './grid';
import { buildAdjustedValues } from './sampleValues';
import { quantizeGrid } from './dither';
import { RAMPS, rampQuantizer } from './ramps';
import { rgbLuminance, adjustBrightnessContrast } from './luminance';
import { normalizeLevelsFlat } from './levels';

// Kernels de Sobel: detectam o gradiente de luminância em cada pixel da
// imagem original — não da grade já reduzida. Ver `buildEdgeField` abaixo
// pra entender por quê.
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
 * Luminância de cada pixel, com os mesmos ajustes (auto-contraste, brilho,
 * contraste, inversão) que o resto do pipeline aplica — mas calculado na
 * resolução original da imagem, não na média por célula.
 */
function buildEdgeField(buf: PixelBuffer, options: ConvertOptions): Float32Array {
  const { width, height, data } = buf;
  const field = new Float32Array(width * height);
  for (let i = 0, p = 0; i < field.length; i++, p += 4) {
    field[i] = rgbLuminance(data[p], data[p + 1], data[p + 2]);
  }

  if (options.autoLevels !== false) normalizeLevelsFlat(field);

  const brightness = options.brightness ?? 0;
  const contrast = options.contrast ?? 0;
  for (let i = 0; i < field.length; i++) {
    let v = adjustBrightnessContrast(field[i], brightness, contrast);
    if (options.invert) v = 255 - v;
    field[i] = v;
  }

  return field;
}

function directionChar(gx: number, gy: number): string {
  // Ângulo do gradiente, normalizado pra 0–180° (a direção do traço é a
  // mesma nos dois sentidos de uma borda). Cada faixa de 45° vira um char.
  const angle = (Math.atan2(gy, gx) * 180) / Math.PI;
  const norm = ((angle % 180) + 180) % 180;
  if (norm < 22.5 || norm >= 157.5) return '|';
  if (norm < 67.5) return '/';
  if (norm < 112.5) return '-';
  return '\\';
}

/**
 * Converte usando contorno: onde a imagem tem uma borda nítida, desenha um
 * traço orientado (-, |, /, \) em vez de um caractere de sombreado. É o que
 * faz o resultado "parecer" a imagem original — o olho reconhece contornos
 * muito mais rápido do que gradientes de densidade.
 */
export function convertEdges(buf: PixelBuffer, options: ConvertOptions): string {
  const ramp = RAMPS.ascii;
  const grid = computeGrid(buf.width, buf.height, options.columns, options.charAspect ?? 2);
  const { columns: cols, rows, cellWidth, cellHeight } = grid;
  const values = buildAdjustedValues(buf, cols, rows, cellWidth, cellHeight, options);

  // A detecção de borda roda pixel a pixel na imagem original, e cada célula
  // do texto herda o traço mais forte que ela contém ("max pooling"). Se
  // calculássemos o Sobel em cima da grade já reduzida (média por célula),
  // um traço fino — comum em line art/anime, onde não há gradiente de
  // sombra pra compensar — seria diluído antes mesmo de virar borda,
  // exigindo muito mais colunas só pra manter o desenho reconhecível.
  const { width, height } = buf;
  const field = buildEdgeField(buf, options);
  const at = (x: number, y: number) => {
    const xc = Math.min(width - 1, Math.max(0, x));
    const yc = Math.min(height - 1, Math.max(0, y));
    return field[yc * width + xc];
  };

  const cellMagnitude: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const cellDirection: string[][] = Array.from({ length: rows }, () => new Array(cols).fill('-'));
  let maxMagnitude = 0;

  for (let r = 0; r < rows; r++) {
    // Mesmo raciocínio de `sampleLuminance` (grid.ts): `round` nos dois
    // limites em vez de floor/ceil independentes, pra célula não roubar o
    // pixel de fronteira da vizinha ao fazer o max-pooling do gradiente.
    const y0 = Math.max(0, Math.round(r * cellHeight));
    const y1 = Math.min(height, Math.max(y0 + 1, Math.round((r + 1) * cellHeight)));
    for (let c = 0; c < cols; c++) {
      const x0 = Math.max(0, Math.round(c * cellWidth));
      const x1 = Math.min(width, Math.max(x0 + 1, Math.round((c + 1) * cellWidth)));

      let bestMag = -1;
      let bestGx = 0;
      let bestGy = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          let gx = 0;
          let gy = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const v = at(x + dx, y + dy);
              gx += v * GX[dy + 1][dx + 1];
              gy += v * GY[dy + 1][dx + 1];
            }
          }
          const m = Math.hypot(gx, gy);
          if (m > bestMag) {
            bestMag = m;
            bestGx = gx;
            bestGy = gy;
          }
        }
      }

      cellMagnitude[r][c] = bestMag;
      cellDirection[r][c] = directionChar(bestGx, bestGy);
      if (bestMag > maxMagnitude) maxMagnitude = bestMag;
    }
  }

  // Limiar relativo ao contraste da própria imagem, com piso absoluto pra
  // não transformar ruído de imagens muito planas em bordas falsas.
  const threshold = Math.max(24, maxMagnitude * 0.22);

  const toLevel = rampQuantizer(ramp);
  const levels = quantizeGrid(values, toLevel, options.dithering !== false);

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      line += cellMagnitude[r][c] >= threshold ? cellDirection[r][c] : ramp[levels[r][c]];
    }
    lines.push(line);
  }
  return lines.join('\n');
}
