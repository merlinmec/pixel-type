export function quantizeGrid(
  values: number[][],
  toLevel: (v: number) => { level: number; value: number },
  diffuse: boolean,
): number[][] {
  const rows = values.length;
  const cols = rows > 0 ? values[0].length : 0;
  const levels: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const { level, value } = toLevel(values[r][c]);
      levels[r][c] = level;
      if (!diffuse) continue;

      const err = values[r][c] - value;
      if (c + 1 < cols) values[r][c + 1] += (err * 7) / 16;
      if (r + 1 < rows) {
        if (c - 1 >= 0) values[r + 1][c - 1] += (err * 3) / 16;
        values[r + 1][c] += (err * 5) / 16;
        if (c + 1 < cols) values[r + 1][c + 1] += (err * 1) / 16;
      }
    }
  }
  return levels;
}
