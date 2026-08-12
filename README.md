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
  dithering Floyd–Steinberg, rampa de densidade, codificação Braille). Puro
  TypeScript, sem dependência de DOM — testável isoladamente.
- `src/lib/loadPixelBuffer.ts` — decodifica a imagem via `<canvas>` e devolve
  os pixels crus pro núcleo processar.
- `src/App.tsx` — a interface: upload, controles, preview em tempo real,
  copiar e baixar `.txt`.
