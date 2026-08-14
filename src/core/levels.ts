export function normalizeLevels(values: number[][]): void {
  let min = Infinity;
  let max = -Infinity;
  for (const row of values) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const range = max - min;
  if (range < 1e-6) return;

  for (const row of values) {
    for (let c = 0; c < row.length; c++) {
      row[c] = ((row[c] - min) / range) * 255;
    }
  }
}

/** Mesma esticada de contraste que `normalizeLevels`, mas para um buffer
 * plano (usado quando trabalhamos na resolução original do pixel, não na
 * grade já reduzida a colunas/linhas de texto). */
export function normalizeLevelsFlat(values: Float32Array): void {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const range = max - min;
  if (range < 1e-6) return;

  for (let i = 0; i < values.length; i++) {
    values[i] = ((values[i] - min) / range) * 255;
  }
}
