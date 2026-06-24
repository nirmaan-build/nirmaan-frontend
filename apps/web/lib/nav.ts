import { Home, LayoutGrid, Truck, User, type LucideIcon } from 'lucide-react';

/** Single nav config consumed two ways: top header (desktop) + bottom tabs (mobile). PRD-03 §3. */
export interface NavItem {
  key: string;
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { key: 'home', href: '/', labelKey: 'home.tab', icon: Home },
  { key: 'categories', href: '/categories', labelKey: 'categories.title', icon: LayoutGrid },
  { key: 'truck', href: '/truck', labelKey: 'truck.tabLabel', icon: Truck },
  { key: 'profile', href: '/profile', labelKey: 'profile.title', icon: User },
];
