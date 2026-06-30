'use client';

/**
 * Tracks the last N page paths the user visited so the Truck page can offer a
 * "back" button that returns to wherever the user came from (e.g. a category
 * page after adding an item). Funnel cap is 5 steps (PRD requirement).
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

const FUNNEL_CAP = 5;

interface NavHistoryCtx {
  /** Ordered from oldest → newest, not including the current page. */
  history: string[];
  /** The page immediately before the current one, or null if none. */
  previous: string | null;
}

const NavHistoryContext = createContext<NavHistoryCtx>({ history: [], previous: null });

export function NavHistoryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [history, setHistory] = useState<string[]>([]);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === prevPathRef.current) return; // same route (hash change etc.)
    setHistory((prev) => {
      const next = [...prev, pathname].slice(-FUNNEL_CAP);
      return next;
    });
    prevPathRef.current = pathname;
  }, [pathname]);

  // `history` includes the current page at the end; previous is second-to-last.
  const previous = history.length >= 2 ? history[history.length - 2] : null;

  return (
    <NavHistoryContext.Provider value={{ history, previous }}>
      {children}
    </NavHistoryContext.Provider>
  );
}

export function useNavHistory() {
  return useContext(NavHistoryContext);
}
