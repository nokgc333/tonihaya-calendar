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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the stored choice is read after hydration on purpose: the statically exported HTML cannot know it
    if (match !== undefined) setValue(match);
  }, [storageKey, allowed]);
  const change = (next: T): void => {
    setValue(next);
    localStorage.setItem(storageKey, next);
  };
  return [value, change];
}
