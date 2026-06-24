'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface Ctx {
  title: string | null;
  setTitle: (t: string | null) => void;
}

const HeaderTitleCtx = createContext<Ctx>({ title: null, setTitle: () => {} });

/** Lets a sub-page publish its title to the mobile back-header (e.g. category name). */
export function HeaderTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  return (
    <HeaderTitleCtx.Provider value={{ title, setTitle }}>{children}</HeaderTitleCtx.Provider>
  );
}

export function useHeaderTitle() {
  return useContext(HeaderTitleCtx);
}

/** Drop-in (incl. from server components): sets the back-header title for the current page. */
export function SetHeaderTitle({ title }: { title: string }) {
  const { setTitle } = useHeaderTitle();
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
  return null;
}
