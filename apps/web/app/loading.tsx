/**
 * Root loading fallback — shown by Next.js App Router during server-component
 * navigation while the new page streams in. Without this file the browser
 * freezes on the old page until the new one is fully ready.
 * Uses the existing .skeleton shimmer class from globals.css.
 */
export default function Loading() {
  return (
    <div style={{ padding: '16px 0' }}>
      <div className="skeleton" style={{ height: 40, marginBottom: 16, borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 76, marginBottom: 10, borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 76, marginBottom: 10, borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 76, marginBottom: 10, borderRadius: 12 }} />
    </div>
  );
}
