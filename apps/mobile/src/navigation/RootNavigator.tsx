import React, { useEffect, useMemo } from 'react';
import { Platform, StatusBar } from 'react-native';
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
  type LinkingOptions,
  type Theme as NavTheme,
} from '@react-navigation/native';
import type { AppStackParamList } from './types';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

/**
 * Status bar that follows the active theme. On Android we also set the bar's
 * background so the system area matches the header surface (translucent bars
 * leave a coloured strip otherwise); iOS only honours barStyle.
 */
function ThemedStatusBar() {
  const t = useTheme();
  return (
    <StatusBar
      barStyle={t.isDark ? 'light-content' : 'dark-content'}
      backgroundColor={Platform.OS === 'android' ? t.colors.bgElevated : undefined}
      translucent={false}
    />
  );
}

/**
 * Deep linking (Stage 13). A payment link sent by the team opens
 * nirmaan://pay/:paymentLinkId, routing straight into the PayLink screen which
 * resolves and opens the hosted Razorpay page. Web handles the same path as a
 * fallback for users without the app installed.
 */
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['nirmaan://', 'https://nirmaan.app'],
  config: {
    screens: {
      PayLink: 'pay/:paymentLinkId',
    },
  },
};

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const t = useTheme();

  useEffect(() => {
    void hydrateSettings();
    void hydrateAuth();
  }, [hydrateAuth, hydrateSettings]);

  const navTheme = useMemo<NavTheme>(() => {
    const base = t.isDark ? NavDarkTheme : NavDefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: t.colors.primary,
        background: t.colors.bg,
        card: t.colors.bgElevated,
        text: t.colors.text,
        border: t.colors.border,
        notification: t.colors.primary,
      },
    };
  }, [t]);

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <ThemedStatusBar />
      {status === 'loading' ? (
        <SplashScreen />
      ) : status === 'unauthenticated' ? (
        <AuthNavigator />
      ) : status === 'onboarding' ? (
        <OnboardingScreen />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}
