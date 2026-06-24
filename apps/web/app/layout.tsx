import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { AppToaster } from './components/AppToaster';
import { HeaderTitleProvider } from './components/HeaderTitle';
import { serverLocale } from '@/lib/serverApi';

export const metadata: Metadata = {
  title: 'Nirmaan — building materials, hyperlocal',
  description:
    'Find building & hardware materials and post requirements to local suppliers in Uttarakhand.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

// Apply the stored light/dark choice before first paint to avoid a theme flash.
// Binary like the mobile app's Dark Mode switch; default is DARK (only an explicit
// 'light' choice opts out).
const themeScript = `(function(){try{var m=localStorage.getItem('nirmaan_theme');document.documentElement.setAttribute('data-theme',m==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = serverLocale();
  return (
    <html lang={locale} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers initialLocale={locale}>
          <HeaderTitleProvider>
            {/* Desktop (>= lg): fixed left sidebar + top bar (QuickMart-style chrome).
                Mobile (< lg): brand/sub header + bottom tab bar. */}
            <Sidebar />
            <div className="app-content">
              <Topbar />
              <MobileHeader />
              <main className="container">{children}</main>
            </div>
            <BottomNav />
          </HeaderTitleProvider>
          <AppToaster />
        </Providers>
      </body>
    </html>
  );
}
