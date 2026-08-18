import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { convertToText, type Charset, type ConvertOptions, type PixelBuffer } from './core/convert';
import { loadPixelBuffer } from './lib/loadPixelBuffer';
import { measureGlyphAspect } from './lib/measureGlyphAspect';
import { useDebounced } from './hooks/useDebounced';
import { useTheme } from './hooks/useTheme';
import logo from './assets/logo.svg';
import './App.css';

const CHARSET_INFO: Record<Charset, { label: string; hint: string }> = {
  edges: {
    label: 'Bordas (recomendado)',
    hint: 'Desenha os contornos da imagem com -, |, / e \\. É o que deixa mais fácil reconhecer o desenho no texto.',
  },
  braille: {
    label: 'Braille',
    hint: 'Altíssima resolução por caractere, mas os pontos ficam sutis — bom pra tons contínuos, difícil de "ler" à primeira vista.',
  },
  ascii: {
    label: 'ASCII clássico',
    hint: '10 caracteres de densidade (" .:-=+*#%@"). Visual retrô, poucos níveis de detalhe.',
  },
  'ascii-extended': {
    label: 'ASCII estendido',
    hint: 'Rampa de densidade bem mais longa — mais níveis de cinza, textura mais suave.',
  },
  blocks: {
    label: 'Blocos █▓▒░',
    hint: 'Poucos níveis, traços grossos. Funciona bem em fonte pequena ou de longe.',
  },
};
const CHARSET_ORDER: Charset[] = ['edges', 'ascii-extended', 'ascii', 'blocks', 'braille'];

function App() {
  const [theme, toggleTheme] = useTheme();
  const [pixelBuffer, setPixelBuffer] = useState<PixelBuffer | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [charAspect, setCharAspect] = useState(2);

  const [charset, setCharset] = useState<Charset>('edges');
  const [columns, setColumns] = useState(110);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [invert, setInvert] = useState(false);
  const [dithering, setDithering] = useState(true);
  const [autoLevels, setAutoLevels] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const probeRef = useRef<HTMLSpanElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!probeRef.current) return;
    const measure = () => {
      if (!probeRef.current) return;
      const measured = measureGlyphAspect(probeRef.current);
      if (measured) setCharAspect(measured);
    };
    // Mede já, com a fonte que estiver disponível agora (fallback ou não),
    // pra não atrasar a primeira conversão — e remede quando a webfont
    // (carregada com display=swap, ver index.html) terminar. Sem isso, numa
    // visita com cache frio a medição inicial usa as métricas da fonte de
    // fallback e o charAspect errado fica preso pelo resto da sessão.
    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const options: ConvertOptions = useMemo(
    () => ({ charset, columns, brightness, contrast, invert, dithering, autoLevels, charAspect }),
    [charset, columns, brightness, contrast, invert, dithering, autoLevels, charAspect],
  );
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
  const previewFontSize = Math.max(6, Math.min(9, 1400 / Math.max(1, columns)));

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Isso não parece ser uma imagem.');
      return;
    }
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const buf = await loadPixelBuffer(file);
      if (requestIdRef.current !== requestId) return;
      setPixelBuffer(buf);
      setFileName(file.name);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : 'Não consegui ler essa imagem.');
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, []);

  // Diálogo nativo de "escolher arquivo" não dá pra customizar (quem decide
  // o que aparece ali — recentes, nuvem, etc. — é o SO/navegador). O que dá
  // pra oferecer é um segundo caminho: colar (Ctrl/Cmd+V) uma imagem que já
  // esteja na área de transferência, sem precisar ter baixado o arquivo.
  useEffect(() => {
    const onPasteImage = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void handleFile(file);
          }
          return;
        }
      }
    };
    window.addEventListener('paste', onPasteImage);
    return () => window.removeEventListener('paste', onPasteImage);
  }, [handleFile]);

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

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setIsDragging(false);
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Não consegui copiar — permissão de área de transferência negada.');
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (fileName?.replace(/\.[^.]+$/, '') || 'text-art') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <span ref={probeRef} className="glyph-probe" aria-hidden="true">
        0
      </span>

      <header className="app-header">
        <img src={logo} alt="mecdev" className="brand-logo" />
        <div className="brand-center">
          <span className="brand-name">Text-Art</span>
          <h1>Converta imagens em arte de texto, pronta pra colar em qualquer lugar</h1>
        </div>
        <button
          type="button"
          className="theme-toggle"
          data-theme={theme}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          <span className="theme-toggle-thumb" aria-hidden="true" />
        </button>
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
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onInputChange} hidden />
            {isLoading ? (
              <p>Lendo imagem…</p>
            ) : pixelBuffer ? (
              <p>
                <strong>{fileName}</strong>
                <br />
                <span className="muted">clique, arraste ou cole (Ctrl+V) outra imagem pra trocar</span>
              </p>
            ) : (
              <p>
                <span className="dropzone-icon" aria-hidden="true">
                  🖼️
                </span>
                <br />
                Arraste uma imagem aqui
                <br />
                <span className="muted">clique pra escolher um arquivo, ou cole com Ctrl+V</span>
              </p>
            )}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="controls" aria-disabled={!pixelBuffer}>
            <label className="field">
              <span>Formato</span>
              <select value={charset} onChange={(e) => setCharset(e.target.value as Charset)}>
                {CHARSET_ORDER.map((value) => (
                  <option key={value} value={value}>
                    {CHARSET_INFO[value].label}
                  </option>
                ))}
              </select>
              <p className="field-hint muted">{CHARSET_INFO[charset].hint}</p>
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

            <div className="checkbox-group">
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

              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={autoLevels}
                  onChange={(e) => setAutoLevels(e.target.checked)}
                />
                <span>Auto-contraste</span>
              </label>
            </div>
          </div>
        </section>

        <section className="panel preview-panel">
          <div className="preview-toolbar">
            <div className="preview-info">
              {previewUrl && (
                <img src={previewUrl} alt="" className="preview-thumb" aria-hidden="true" />
              )}
              <span className="muted">
                {pixelBuffer ? `${lines.length} linhas × ${columns} colunas` : 'sem imagem ainda'}
              </span>
            </div>
            <div className="actions">
              <button type="button" onClick={handleCopy} disabled={!output}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              <button type="button" onClick={handleDownload} disabled={!output} className="secondary">
                Baixar .txt
              </button>
            </div>
          </div>
          <div className="preview-scroll">
            {output ? (
              <pre className="preview" style={{ fontSize: `${previewFontSize}px` }}>
                {output}
              </pre>
            ) : (
              <div className="placeholder" role="img" aria-label="A arte em texto aparece aqui depois de enviar uma imagem">
                <span className="placeholder-glyph" aria-hidden="true">
                  {'<✦/>'}
                </span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
