'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Boxes, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { clearToken, getToken, getRole, type AdminRole } from '@/lib/api';
import { NAV, titleFor } from './nav';

type Theme = 'light' | 'dark';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [role, setRoleState] = useState<AdminRole | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [drawer, setDrawer] = useState(false);

  // Read auth/role/theme once on mount — not on every route change.
  // Repeating these setState calls on pathname was triggering 3 cascading
  // re-renders of the entire shell on every navigation.
  useEffect(() => {
    setAuthed(Boolean(getToken()));
    setRoleState(getRole());
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'light' || current === 'dark') setTheme(current);
  }, []);

  // Close mobile drawer on route change only.
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const isLogin = pathname === '/login';

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem('nirmaan_admin_theme', next);
    } catch {
      /* ignore */
    }
  }

  function logout() {
    clearToken();
    router.push('/login');
  }

  // Login page renders standalone (no sidebar / top bar).
  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="app">
      <aside className={`sidebar${drawer ? ' open' : ''}`}>
        <div className="brand">
          <span className="logo">
            <Boxes size={19} />
          </span>
          <span>Nirmaan</span>
        </div>
        <nav className="nav-section">
          <div className="nav-label">Manage</div>
          {NAV.filter(
            (item) => !item.roles || (role !== null && item.roles.includes(role)),
          ).map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {authed && (
          <div className="sidebar-foot">
            <button
              className="ghost"
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={logout}
            >
              <LogOut />
              Log out
            </button>
          </div>
        )}
      </aside>

      <div
        className={`backdrop${drawer ? ' show' : ''}`}
        onClick={() => setDrawer(false)}
      />

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn hamburger"
            aria-label="Menu"
            onClick={() => setDrawer((d) => !d)}
          >
            {drawer ? <X /> : <Menu />}
          </button>
          <span className="page-title">{titleFor(pathname)}</span>
          <span className="spacer" />
          <button
            className="icon-btn"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
