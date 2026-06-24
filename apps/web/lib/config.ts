export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const COOKIES = {
  accessToken: 'nirmaan_at',
  refreshToken: 'nirmaan_rt',
  user: 'nirmaan_user',
  locale: 'nirmaan_locale',
  // First-party device id for analytics — survives SSR/CSR (PRD-03 §7).
  anonymousId: 'nirmaan_anon',
} as const;
