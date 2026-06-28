import Link from 'next/link';
import { ClipboardList, ArrowRight, PackageOpen, ArrowLeft } from 'lucide-react';
import { serverApi, serverLocale, serverPincode } from '@/lib/serverApi';
import { st } from '@/lib/i18n-server';
import { money } from '@/lib/format';
import { AddToTruck } from '../../../components/AddToTruck';
import { EmptyState } from '../../../components/EmptyState';
import { SetHeaderTitle } from '../../../components/HeaderTitle';
import { TrackView } from '../../../components/TrackView';
import type { Category, CatalogSearchResult } from '@/lib/types';

// SSR — one supplier's catalog within a category (PRD-03 §4.4). Dynamic for pincode cookie.
export const dynamic = 'force-dynamic';

export default async function SupplierCatalogPage({
  params,
}: {
  params: { slug: string; supplierId: string };
}) {
  const locale = serverLocale();
  const pincode = serverPincode();
  const { slug: categoryId, supplierId } = params;

  const [categories, catalog] = await Promise.all([
    serverApi<Category[]>(`/categories?locale=${locale}`, { revalidate: 300 }),
    pincode
      ? serverApi<CatalogSearchResult>(
          `/catalog?category=${categoryId}&supplierId=${supplierId}&pincode=${pincode}`,
        )
      : Promise.resolve(null),
  ]);

  const categoryName =
    categories?.find((c) => c.id === categoryId)?.name ?? st('categories.title');
  const items = catalog?.items ?? [];
  // Pull supplier name from first item once available; fall back to a generic label.
  const supplierName = items[0]?.supplier?.businessName ?? 'Supplier catalog';
  const pageTitle = `${supplierName} — ${categoryName}`;

  return (
    <>
      <SetHeaderTitle title={pageTitle} />
      <TrackView
        eventType="supplier_catalog.viewed"
        categoryId={categoryId}
        pincode={pincode || undefined}
      />

      {/* Back link to the supplier list */}
      <Link
        href={`/categories/${categoryId}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}
      >
        <ArrowLeft size={14} />
        {categoryName}
      </Link>

      <h1 className="page-title" style={{ marginBottom: 4 }}>{supplierName}</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 13 }}>{categoryName}</p>

      {/* RFQ entry — always visible (PRD-02 §3.6). */}
      <Link href={`/rfq/new?category=${categoryId}`} className="banner">
        <ClipboardList size={18} />
        <span style={{ flex: 1 }}>
          {st('categoryPage.cantFind')} {st('categoryPage.postRequirement')}
        </span>
        <ArrowRight size={18} />
      </Link>

      {!pincode ? (
        <p className="muted" style={{ marginTop: 16 }}>
          Set your delivery area to browse this supplier's items.
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          Icon={PackageOpen}
          title={st('categoryPage.empty')}
          action={
            <Link href={`/rfq/new?category=${categoryId}`}>
              <button className="primary">{st('categoryPage.postRequirement')}</button>
            </Link>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((item) => {
            const img = item.imageUrls?.[0];
            return (
              <div
                key={item.id}
                className="card"
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* Image */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 180,
                    background: 'var(--skeleton)',
                    flexShrink: 0,
                  }}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PackageOpen size={40} style={{ color: 'var(--muted)', opacity: 0.4 }} />
                    </div>
                  )}
                </div>

                {/* Body */}
                <div
                  style={{
                    padding: '14px 16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    gap: 6,
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, lineHeight: '20px' }}>
                    {item.title}
                  </p>

                  {item.priceEstimate && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                      {st('categoryPage.estimate', {
                        price: money(item.priceEstimate),
                        unit: item.unit,
                      })}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
                    <AddToTruck catalogItemId={item.id} />
                    <Link href={`/rfq/new?category=${categoryId}`} style={{ flex: 1 }}>
                      <button className="primary" style={{ width: '100%' }}>
                        {st('categoryPage.postRequirement')}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
