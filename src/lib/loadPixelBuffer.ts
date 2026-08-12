import type { PixelBuffer } from '../core/types';

/**
 * Decodifica um arquivo de imagem e devolve os pixels crus, já
 * reduzidos a uma resolução de trabalho razoável (a conversão em
 * texto nunca precisa da imagem em resolução total — 100 colunas de
 * saída não ganham nada com uma fonte de 4000px de largura, só deixa
 * a amostragem mais lenta).
 */
export async function loadPixelBuffer(file: File, maxDimension = 1600): Promise<PixelBuffer> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Este navegador não suporta canvas 2D.');

    ctx.drawImage(bitmap, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return { width, height, data: imageData.data };
  } finally {
    bitmap.close();
  }
}
