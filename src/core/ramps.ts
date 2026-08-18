export const RAMPS = {
  ascii: ' .:-=+*#%@',
  'ascii-extended':
    ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
} as const;

export type RampCharset = keyof typeof RAMPS;

/** Fecha uma rampa de caracteres num quantizador: dado um valor de
 * luminância (0–255), devolve o índice do caractere mais próximo na rampa
 * e a luminância que esse caractere representa (usada pelo Floyd–Steinberg
 * pra calcular o erro a difundir). Compartilhado por convertRamp e
 * convertEdges — os dois mapeiam luminância pra densidade da mesma forma,
 * só a fonte dos valores muda. */
export function rampQuantizer(ramp: string) {
  const n = ramp.length;
  return (v: number) => {
    const level = Math.min(n - 1, Math.max(0, Math.round(((255 - v) / 255) * (n - 1))));
    const value = 255 - (level / (n - 1)) * 255;
    return { level, value };
  };
}
