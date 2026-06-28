/**
 * Root loading fallback — shown by Next.js App Router during server-component
 * navigation while the new page streams in. Without this file the browser
 * freezes on the old page until the new one is fully ready.
 */
export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 0',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          animation: 'admin-spin 0.65s linear infinite',
        }}
      />
      {/* Scoped keyframes so this doesn't pollute global styles */}
      <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
