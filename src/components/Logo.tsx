// SVG inline em vez de <img src="logo.svg">: dentro de um <img> o CSS da
// página não alcança o desenho, e o "DEV />" branco fixo sumia no fundo
// pergaminho do tema claro. Aqui o texto usa currentColor (a cor de texto
// do tema) e o gradiente do "MEC" vem de tokens que cada tema define.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="200"
      height="80"
      viewBox="0 0 200 80"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="mecdev"
    >
      <defs>
        <linearGradient id="gradienteMEC" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--logo-mec-start)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--logo-mec-end)' }} />
        </linearGradient>
      </defs>
      <text x="10" y="35" fontFamily="Arial Black" fontSize="30" fill="currentColor">
        {/* espaços explícitos: no SVG original a quebra de linha entre os
            tspans é que separava "<" de "MEC" e "DEV" de "/>" */}
        <tspan>&lt;</tspan> <tspan fill="url(#gradienteMEC)">MEC</tspan>{' '}
        <tspan dy="1.2em" dx="-2.8em">
          DEV
        </tspan>{' '}
        <tspan>/&gt;</tspan>
      </text>
    </svg>
  );
}
