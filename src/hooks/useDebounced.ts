import { useEffect, useState } from 'react';

/** Atrasa a propagação de um valor — usado pra não recalcular a cada pixel de um slider arrastado. */
export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
