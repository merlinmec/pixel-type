export function rgbLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

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
