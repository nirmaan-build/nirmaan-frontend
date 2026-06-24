import type { CSSProperties } from 'react';

/** Shimmer skeleton block (PRD-02 §4 — skeletons, not spinners). */
export function Skeleton({
  height = 16,
  width = '100%',
  radius,
  style,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      style={{ height, width, ...(radius != null ? { borderRadius: radius } : {}), ...style }}
    />
  );
}

/** A card-shaped placeholder: title line + two meta lines. */
export function SkeletonCard() {
  return (
    <div className="card" aria-hidden>
      <Skeleton height={16} width="60%" />
      <Skeleton height={12} width="40%" style={{ marginTop: 10 }} />
      <Skeleton height={12} width="30%" style={{ marginTop: 8 }} />
    </div>
  );
}

/** A list of card placeholders for loading states. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
