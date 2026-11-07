import { useEffect, useState } from "react";

export function usePersistedChoice<T extends string>(
  storageKey: string,
  initial: T,
  allowed: readonly T[],
): readonly [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const match = allowed.find((option) => option === saved);
    if (match !== undefined) setValue(match);
  }, [storageKey, allowed]);
  const change = (next: T): void => {
    setValue(next);
    localStorage.setItem(storageKey, next);
  };
  return [value, change];
}
