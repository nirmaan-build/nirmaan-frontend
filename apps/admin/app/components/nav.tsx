import {
  LayoutDashboard,
  FolderTree,
  Ruler,
  MapPin,
  Store,
  PackageSearch,
  Megaphone,
  ScrollText,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // If set, only these admin roles see this item (PRD-04 §4.2).
  roles?: string[];
}

export const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/growth', label: 'Growth Intelligence', icon: TrendingUp },
  { href: '/categories', label: 'Categories', icon: FolderTree },
  { href: '/units', label: 'Units', icon: Ruler },
  { href: '/areas', label: 'Serviceable Areas', icon: MapPin },
  { href: '/suppliers', label: 'Suppliers', icon: Store },
  { href: '/catalog', label: 'Catalog', icon: PackageSearch },
  { href: '/callbacks', label: 'Callback Requests', icon: PhoneCall },
  { href: '/disputes', label: 'Disputes', icon: ShieldAlert },
  { href: '/broadcast', label: 'Broadcast', icon: Megaphone },
  { href: '/audit', label: 'Audit Log', icon: ScrollText, roles: ['SUPER_ADMIN', 'OPS'] },
  { href: '/admins', label: 'Admins', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
];

export function titleFor(pathname: string): string {
  const exact = NAV.find((n) => n.href === pathname);
  if (exact) return exact.label;
  const nested = NAV.filter((n) => n.href !== '/').find((n) =>
    pathname.startsWith(n.href),
  );
  return nested?.label ?? 'Dashboard';
}
