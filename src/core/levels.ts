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
