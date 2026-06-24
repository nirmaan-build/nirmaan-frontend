import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Centered empty placeholder (icon + title + optional subtitle + action). */
export function EmptyState({
  Icon,
  title,
  subtitle,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card empty-state">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <strong className="empty-title">{title}</strong>
      {subtitle ? <p className="muted empty-sub">{subtitle}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
