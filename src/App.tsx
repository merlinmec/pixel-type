import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { convertToText, type Charset, type ConvertOptions, type PixelBuffer } from './core/convert';
import { loadPixelBuffer } from './lib/loadPixelBuffer';
import { useDebounced } from './hooks/useDebounced';
import './App.css';

const CHARSET_LABELS: Record<Charset, string> = {
  braille: 'Braille (mais denso)',
  ascii: 'ASCII clássico',
  'ascii-extended': 'ASCII estendido',
  blocks: 'Blocos █▓▒░',
};

function App() {
  const [pixelBuffer, setPixelBuffer] = useState<PixelBuffer | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [charset, setCharset] = useState<Charset>('braille');
  const [columns, setColumns] = useState(110);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [invert, setInvert] = useState(false);
  const [dithering, setDithering] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  const options: ConvertOptions = useMemo(
    () => ({ charset, columns, brightness, contrast, invert, dithering }),
    [charset, columns, brightness, contrast, invert, dithering],
  );
  // recalcular a cada pixel de slider arrastado seria desperdício — espera o gesto assentar
  const debouncedOptions = useDebounced(options, 60);

  const output = useMemo(() => {
    if (!pixelBuffer) return '';
    try {
      return convertToText(pixelBuffer, debouncedOptions);
    } catch {
      return '';
    }
  }, [pixelBuffer, debouncedOptions]);

  const lines = output ? output.split('\n') : [];
  const fontSize = Math.max(3.5, Math.min(9, 900 / Math.max(1, columns)));

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Isso não parece ser uma imagem.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const buf = await loadPixelBuffer(file);
      setPixelBuffer(buf);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não consegui ler essa imagem.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (fileName?.replace(/\.[^.]+$/, '') || 'textura') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="app-header">
        <p className="eyebrow">Textura</p>
        <h1>Imagem vira texto de verdade</h1>
        <p className="dek">
          Nada acontece fora do seu navegador. Envie uma imagem, ajuste os controles e copie o
          resultado — é texto puro, cola em qualquer lugar.
        </p>
      </header>

      <main className="layout">
        <section className="panel">
          <div
            className={`dropzone${isDragging ? ' dropzone--active' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onInputChange}
              hidden
            />
            {isLoading ? (
              <p>Lendo imagem…</p>
            ) : pixelBuffer ? (
              <p>
                <strong>{fileName}</strong>
                <br />
                <span className="muted">clique ou arraste outra imagem pra trocar</span>
              </p>
            ) : (
              <p>
                Arraste uma imagem aqui
                <br />
                <span className="muted">ou clique para escolher um arquivo</span>
              </p>
            )}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="controls" aria-disabled={!pixelBuffer}>
            <label className="field">
              <span>Formato</span>
              <select value={charset} onChange={(e) => setCharset(e.target.value as Charset)}>
                {Object.entries(CHARSET_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>
                Largura <span className="value">{columns} col</span>
              </span>
              <input
                type="range"
                min={30}
                max={240}
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
              />
            </label>

            <label className="field">
              <span>
                Brilho <span className="value">{brightness}</span>
              </span>
              <input
                type="range"
                min={-100}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
              />
            </label>

            <label className="field">
              <span>
                Contraste <span className="value">{contrast}</span>
              </span>
              <input
                type="range"
                min={-100}
                max={100}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
              />
            </label>

            <label className="checkbox">
              <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
              <span>Inverter</span>
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={dithering}
                onChange={(e) => setDithering(e.target.checked)}
              />
              <span>Dithering</span>
            </label>
          </div>
        </section>

        <section className="panel preview-panel">
          <div className="preview-toolbar">
            <span className="muted">
              {pixelBuffer ? `${lines.length} linhas × ${columns} colunas` : 'sem imagem ainda'}
            </span>
            <div className="actions">
              <button type="button" onClick={handleCopy} disabled={!output}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              <button type="button" onClick={handleDownload} disabled={!output}>
                Baixar .txt
              </button>
            </div>
          </div>
          <div className="preview-scroll">
            {output ? (
              <pre className="preview" style={{ fontSize: `${fontSize}px` }}>
                {output}
              </pre>
            ) : (
              <p className="placeholder muted">o resultado aparece aqui</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
