import { useEffect, useRef, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay = 300
): T {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  return ((...args: Parameters<T>) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => callback(...args), delay);
  }) as T;
}
