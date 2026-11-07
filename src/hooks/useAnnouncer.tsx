"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Announce = (message: string) => void;

const NO_BREAK_SPACE = " ";

const AnnouncerContext = createContext<Announce>(() => undefined);

export function AnnouncerProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [text, setText] = useState("");
  const announce = useCallback<Announce>((message) => {
    setText((previous) => {
      if (previous.trim() !== message) return message;
      return previous.endsWith(NO_BREAK_SPACE)
        ? message
        : `${message}${NO_BREAK_SPACE}`;
    });
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {text}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer(): Announce {
  return useContext(AnnouncerContext);
}
