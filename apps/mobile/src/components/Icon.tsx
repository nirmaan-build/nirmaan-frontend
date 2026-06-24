import React from 'react';
import type { ViewStyle } from 'react-native';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Globe,
  Hammer,
  HelpCircle,
  Home,
  Info,
  LayoutGrid,
  LogOut,
  MapPin,
  Minus,
  Moon,
  Package,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Tag,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react-native';
import { useTheme } from '../theme';

/**
 * Central icon registry. Screens reference icons by semantic name so the icon
 * set can be swapped in one place. Backed by lucide-react-native (SVG via
 * react-native-svg) for crisp, native-feeling vector icons on iOS + Android.
 */
const ICONS = {
  home: Home,
  categories: LayoutGrid,
  truck: Truck,
  cart: ShoppingCart,
  profile: User,
  user: User,
  search: Search,
  location: MapPin,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  back: ArrowLeft,
  edit: Pencil,
  bell: Bell,
  language: Globe,
  moon: Moon,
  sun: Sun,
  help: HelpCircle,
  privacy: ShieldCheck,
  terms: FileText,
  logout: LogOut,
  supplier: Tag,
  tag: Tag,
  package: Package,
  phone: Phone,
  materials: Hammer,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  trash: Trash2,
  requirements: ClipboardList,
  alert: AlertCircle,
  info: Info,
  success: CheckCircle2,
} as const;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
}

export function Icon({ name, size = 22, color, strokeWidth = 2, style }: Props) {
  const t = useTheme();
  const Cmp = (ICONS[name] ?? Info) as React.ComponentType<any>;
  return (
    <Cmp
      size={size}
      color={color ?? t.colors.text}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}
