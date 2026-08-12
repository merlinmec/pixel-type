/**
 * Luminância perceptual (Rec. 601), não a média simples (R+G+B)/3 —
 * o olho pesa verde muito mais que azul.
 */
export function rgbLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Ajuste linear de brilho/contraste em torno do ponto médio (128).
 * brightness e contrast em -100..100; 0 é neutro.
 */
export function adjustBrightnessContrast(
  y: number,
  brightness: number,
  contrast: number,
): number {
  const offset = (brightness / 100) * 128;
  const factor = 1 + contrast / 100;
  const v = (y - 128) * factor + 128 + offset;
  return Math.min(255, Math.max(0, v));
}
