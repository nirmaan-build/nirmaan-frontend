import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from './components/AppShell';
import { AppToaster } from './components/AppToaster';

export const metadata: Metadata = {
  title: 'Nirmaan Admin',
  description: 'Nirmaan admin panel',
};

// Set the theme before paint to avoid a flash. Dark is the default.
const themeScript = `(function(){try{var t=localStorage.getItem('nirmaan_admin_theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <AppToaster />
      </body>
    </html>
  );
}
