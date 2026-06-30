import Link from 'next/link';
import { Package, Star } from 'lucide-react';
import { st } from '@/lib/i18n-server';
import { money } from '@/lib/format';
import { SearchBox } from './components/SearchBox';
import { MyRequirements } from './components/MyRequirements';
import type { Category, CatalogSearchResult } from '@/lib/types';
import { serverApi, serverLocale, serverPincode, isAuthed } from '@/lib/serverApi';

// SSR (server component) — SEO-critical, content changes per area (PRD-03 §5).
export const dynamic = 'force-dynamic';

const POPULAR_LIMIT = 6;

export default async function HomePage() {
  const locale = serverLocale();
  const pincode = serverPincode();
  const authed = isAuthed();

  const categories =
    (await serverApi<Category[]>(`/categories?locale=${locale}`, { revalidate: 300 })) ?? [];
  const popular = pincode
    ? await serverApi<CatalogSearchResult>(`/catalog?pincode=${pincode}`)
    : null;
  const popularItems = popular?.items ?? [];
  const shownPopular = popularItems.slice(0, POPULAR_LIMIT);

  return (
    <>
      {/* Page-level search — hidden on desktop (Topbar has one) */}
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

      {/* ── Shop by Category — horizontal chip scroller ── */}
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

      {/* ── Popular near you — 2-col grid cards ── */}
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
        <div className="popular-grid">
          {shownPopular.map((item) => {
            const img = item.imageUrls?.[0];
            // rating/review fields are optional — backend may not include them yet
            const rating = (item as any).avgRating as number | null | undefined;
            const reviewCount = (item as any).reviewCount as number | null | undefined;
            return (
              <div key={item.id} className="popular-card">
                {/* Thumbnail */}
                <div className="popular-img">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={item.title} />
                  ) : (
                    <Package size={32} style={{ color: 'var(--muted)', opacity: 0.35 }} />
                  )}
                </div>
                {/* Info */}
                <div className="popular-body">
                  <p className="popular-title">{item.title}</p>
                  <p className="popular-price">
                    {money(item.priceEstimate)}
                    <span className="popular-unit"> / {item.unit}</span>
                  </p>
                  {item.supplier ? (
                    <p className="popular-supplier">{item.supplier.businessName}</p>
                  ) : null}
                  {/* Rating row — only shown when data is available */}
                  {rating != null ? (
                    <div className="popular-rating">
                      <Star size={12} fill="currentColor" />
                      <span>{rating.toFixed(1)}</span>
                      {reviewCount != null && reviewCount > 0 ? (
                        <span className="popular-review-count">({reviewCount})</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── My Requirements — grid, client-rendered when logged in ── */}
      <MyRequirements />
    </>
  );
}
