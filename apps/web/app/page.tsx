import Link from 'next/link';
import { Package } from 'lucide-react';
import { st } from '@/lib/i18n-server';
import { money } from '@/lib/format';
import { SearchBox } from './components/SearchBox';
import type { Category, CatalogSearchResult } from '@/lib/types';
import { serverApi, serverLocale, serverPincode, isAuthed } from '@/lib/serverApi';

// SSR (server component) — SEO-critical, content changes per area (PRD-03 §5).
export const dynamic = 'force-dynamic';

const POPULAR_LIMIT = 6;

export default async function HomePage() {
  const locale = serverLocale();
  const pincode = serverPincode();
  const authed = isAuthed();

  // Categories are semi-static — cache for 5 min at the data layer.
  // The page stays force-dynamic (user-personalized popular items), but
  // the categories list won't cause a backend round-trip on every load.
  const categories =
    (await serverApi<Category[]>(`/categories?locale=${locale}`, { revalidate: 300 })) ?? [];
  const popular = pincode
    ? await serverApi<CatalogSearchResult>(`/catalog?pincode=${pincode}`)
    : null;
  const popularItems = popular?.items ?? [];
  const shownPopular = popularItems.slice(0, POPULAR_LIMIT);

  return (
    <>
      <div className="page-search">
        <SearchBox placeholder={st('home.searchPlaceholder')} />
      </div>

      {!authed ? (
        <div className="card" style={{ marginTop: 14 }}>
          <p className="muted">{st('auth.subtitle')}</p>
          <Link href="/login">
            <button className="primary">{st('auth.title')}</button>
          </Link>
        </div>
      ) : null}

      {/* Categories — horizontal scroller with a View all link (Home only). */}
      <div className="section-head">
        <h2>{st('home.categories')}</h2>
        {categories.length > 0 ? (
          <Link href="/categories" className="view-all">
            {st('home.viewAll')}
          </Link>
        ) : null}
      </div>
      {categories.length === 0 ? (
        <p className="muted">{st('categories.empty')}</p>
      ) : (
        <div className="cat-scroll">
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.id}`} className="chip">
              <span className="ic"><Package size={22} /></span>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Popular near you — capped at 6, with View all → /popular when there are more. */}
      <div className="section-head">
        <h2>{st('home.popularNearYou')}</h2>
        {popularItems.length > POPULAR_LIMIT ? (
          <Link href="/popular" className="view-all">
            {st('home.viewAll')}
          </Link>
        ) : null}
      </div>
      {shownPopular.length === 0 ? (
        <p className="muted">{st('home.noItems')}</p>
      ) : (
        shownPopular.map((item) => (
          <div key={item.id} className="card">
            <strong>{item.title}</strong>
            <div className="meta">
              {money(item.priceEstimate)} / {item.unit}
              {item.supplier ? `  ·  ${item.supplier.businessName}` : ''}
            </div>
          </div>
        ))
      )}
    </>
  );
}
