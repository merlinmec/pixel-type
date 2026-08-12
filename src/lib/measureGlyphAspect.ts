export function measureGlyphAspect(el: HTMLElement): number | null {
  const rect = el.getBoundingClientRect();
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
  if (rect.width <= 0 || !Number.isFinite(lineHeight) || lineHeight <= 0) return null;
  return lineHeight / rect.width;
}
