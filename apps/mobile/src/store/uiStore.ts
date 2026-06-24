import { create } from 'zustand';

interface UiState {
  /** Nesting counter so overlapping async calls don't hide the loader early. */
  loadingCount: number;
  loadingLabel?: string;
  showLoader: (label?: string) => void;
  hideLoader: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  loadingCount: 0,
  loadingLabel: undefined,
  showLoader: (label) =>
    set((s) => ({ loadingCount: s.loadingCount + 1, loadingLabel: label })),
  hideLoader: () =>
    set((s) => {
      const next = Math.max(0, s.loadingCount - 1);
      return { loadingCount: next, loadingLabel: next === 0 ? undefined : s.loadingLabel };
    }),
}));

/**
 * Wrap any promise with the global blocking loader. Guarantees the loader is
 * hidden even if the promise rejects.
 */
export async function withGlobalLoader<T>(
  promise: Promise<T>,
  label?: string,
): Promise<T> {
  const { showLoader, hideLoader } = useUiStore.getState();
  showLoader(label);
  try {
    return await promise;
  } finally {
    hideLoader();
  }
}
