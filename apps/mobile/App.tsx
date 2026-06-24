import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BootSplash from 'react-native-bootsplash';
import Toast from 'react-native-toast-message';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GlobalLoader } from './src/components/Loader';
import { toastConfig } from './src/components/ToastConfig';
import { initAnalytics } from './src/lib/analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export default function App() {
  useEffect(() => {
    // Hide the native splash once the JS bundle + first render are ready.
    const id = setTimeout(() => {
      BootSplash.hide({ fade: true }).catch(() => {});
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Business-signal analytics: batching, app-state flush, offline replay,
  // anonymous→identified stitching (PRD-02 §6).
  useEffect(() => initAnalytics(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator />
          <GlobalLoader />
          <Toast config={toastConfig} topOffset={56} />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
