/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The canonical i18n lives in ../../packages/shared (no workspace tooling).
  // `externalDir` lets Next compile that TS imported via the tsconfig path alias
  // "@nirmaan/shared" -> ../../packages/shared/index.ts.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
