import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';

/** Uppercase section label above a settings group. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="settings-label">{children}</div>;
}

/** A flat card that groups settings rows (dividers between them). */
export function SettingsGroup({ children }: { children: ReactNode }) {
  return <div className="card settings-group">{children}</div>;
}

/**
 * A grouped settings row: tinted icon tile, title + subtitle, right accessory
 * (defaults to a chevron). Renders as a button when `onClick` is given.
 * Mirrors the mobile app's SettingsRow.
 */
export function SettingsRow({
  Icon,
  title,
  subtitle,
  href,
  onClick,
  right,
  danger,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  const inner = (
    <>
      <span className={`settings-tile${danger ? ' danger' : ''}`}>
        <Icon size={18} />
      </span>
      <span className="settings-body">
        <span className={`settings-title${danger ? ' danger' : ''}`}>{title}</span>
        {subtitle ? <span className="settings-sub">{subtitle}</span> : null}
      </span>
      {right ?? <ChevronRight size={20} className="settings-chevron" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="settings-row">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" className="settings-row" onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className="settings-row">{inner}</div>;
}
