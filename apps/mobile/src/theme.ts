import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useColorScheme,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSettingsStore, type ThemeMode } from './store/settingsStore';

/**
 * Design tokens + runtime light/dark theming.
 *
 * Colors are the only thing that changes between modes; spacing / radius / font
 * are mode-independent. Components read the active theme via `useTheme()` and
 * build their StyleSheet through `useThemedStyles(makeStyles)` so a mode switch
 * re-themes the whole app with no reload. One shared theme = consistent surfaces
 * across every tab (PRD-02 §4 "design system … non-negotiable").
 */

export interface ThemeColors {
  bg: string;
  bgElevated: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  primaryText: string;
  primaryMuted: string;
  danger: string;
  ok: string;
  skeleton: string;
  overlay: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  bg: '#f4f6f9',
  bgElevated: '#ffffff',
  card: '#ffffff',
  border: '#e4e7ec',
  text: '#161b22',
  muted: '#69707d',
  primary: '#1f6feb',
  primaryText: '#ffffff',
  primaryMuted: '#e8f0fe',
  danger: '#c0392b',
  ok: '#1f9d55',
  skeleton: '#e7ebf0',
  overlay: 'rgba(15, 18, 25, 0.45)',
  shadow: '#0b1220',
};

export const darkColors: ThemeColors = {
  bg: '#0e1116',
  bgElevated: '#161a21',
  card: '#171b23',
  border: '#272c37',
  text: '#e7eaf0',
  muted: '#9aa3b2',
  primary: '#4c8dff',
  primaryText: '#ffffff',
  primaryMuted: '#1a2740',
  danger: '#ff6b5e',
  ok: '#35c46b',
  skeleton: '#222733',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

export const spacing = (n: number) => n * 4;
export const radius = { sm: 6, md: 10, lg: 16, xl: 22, pill: 999 } as const;
export const font = { xs: 12, sm: 14, md: 16, lg: 20, xl: 26, xxl: 32 } as const;

/**
 * Typographic scale — one source of truth for headings, titles, body, captions
 * and labels so type stays consistent across every screen. Colour is applied by
 * the AppText component, not baked in here.
 */
export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label';

export const typography: Record<TypographyVariant, TextStyle> = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: 0.2 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: 0.2 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.5 },
};

/** Soft shadow presets (cards are "a little highlighted" per design direction). */
function makeElevation(shadowColor: string) {
  const shadow = (
    height: number,
    radius_: number,
    opacity: number,
    elevation: number,
  ): ViewStyle => ({
    shadowColor,
    shadowOffset: { width: 0, height },
    shadowOpacity: opacity,
    shadowRadius: radius_,
    elevation,
  });
  return {
    none: {} as ViewStyle,
    sm: shadow(1, 3, 0.06, 2),
    card: shadow(4, 12, 0.08, 4),
    md: shadow(6, 16, 0.1, 6),
    lg: shadow(10, 24, 0.14, 12),
  };
}

export type Elevation = ReturnType<typeof makeElevation>;

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  font: typeof font;
  typography: typeof typography;
  elevation: Elevation;
  mode: 'light' | 'dark';
  isDark: boolean;
}

function buildTheme(mode: 'light' | 'dark'): Theme {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return {
    colors,
    spacing,
    radius,
    font,
    typography,
    elevation: makeElevation(colors.shadow),
    mode,
    isDark: mode === 'dark',
  };
}

/** Default (light) theme — used as the context fallback before the provider mounts. */
export const theme = buildTheme('dark');

const ThemeContext = createContext<Theme>(theme);

/** Resolve the effective light/dark mode from the user's preference + OS setting. */
export function useResolvedMode(): 'light' | 'dark' {
  const mode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();
  return resolveMode(mode, system);
}

export function resolveMode(
  mode: ThemeMode,
  system: 'light' | 'dark' | null | undefined,
): 'light' | 'dark' {
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
  return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const resolved = useResolvedMode();
  const value = useMemo(() => buildTheme(resolved), [resolved]);
  return React.createElement(ThemeContext.Provider, { value }, children);
}

/** The active theme (colors + tokens) for the current mode. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Memoized StyleSheet bound to the active theme. */
export function useThemedStyles<T>(factory: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => factory(t), [t, factory]);
}
