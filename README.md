# Textura

Converte uma imagem em arte de caracteres — texto de verdade, selecionável e
colável em qualquer lugar. Roda inteiro no navegador, sem backend.

## Rodando local

```bash
npm install
npm run dev
```

## Testes

```bash
npm run test
```

## Estrutura

- `src/core/` — o algoritmo em si (luminância, grade com correção de proporção,
  dithering Floyd–Steinberg, rampa de densidade, codificação Braille, detecção
  de bordas via Sobel). Puro TypeScript, sem dependência de DOM — testável
  isoladamente.

### Formatos de saída

- **Bordas** (`convertEdges.ts`, padrão) — calcula o gradiente de luminância
  (Sobel) em cada célula da grade e desenha um traço orientado (`- | / \`)
  onde há um contorno nítido; preenche o resto com a rampa ASCII. É o que
  mais aproxima o texto do desenho original.
- **Braille / ASCII clássico / ASCII estendido / Blocos** — mapeiam a
  luminância de cada célula pra um caractere de densidade crescente, com
  dithering Floyd–Steinberg opcional.
- `src/lib/loadPixelBuffer.ts` — decodifica a imagem via `<canvas>` e devolve
  os pixels crus pro núcleo processar.
- `src/App.tsx` — a interface: upload, controles, preview em tempo real,
  copiar e baixar `.txt`.
