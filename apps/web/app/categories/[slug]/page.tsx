import Link from 'next/link';
import { ClipboardList, ArrowRight, PackageOpen } from 'lucide-react';
import { serverApi, serverLocale, serverPincode } from '@/lib/serverApi';
import { st } from '@/lib/i18n-server';
import { money } from '@/lib/format';
import { AddToTruck } from '../../components/AddToTruck';
import { EmptyState } from '../../components/EmptyState';
import { SetHeaderTitle } from '../../components/HeaderTitle';
import { TrackView } from '../../components/TrackView';
import type { Category, CatalogSearchResult } from '@/lib/types';

// SSR — filtered catalog for a category (PRD-03 §4.4, §5). slug = categoryId.
export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const locale = serverLocale();
  const pincode = serverPincode();
  const categoryId = params.slug;

  const [categories, catalog] = await Promise.all([
    // Categories are semi-static — cache for 5 min at the data layer.
    serverApi<Category[]>(`/categories?locale=${locale}`, { revalidate: 300 }),
    pincode
      ? serverApi<CatalogSearchResult>(
          `/catalog?category=${categoryId}&pincode=${pincode}`,
        )
      : Promise.resolve(null),
  ]);
  const categoryName =
    categories?.find((c) => c.id === categoryId)?.name ?? st('categories.title');
  const items = catalog?.items ?? [];

  // Lightweight structured data for the hyperlocal-SEO strategy (PRD-03 §4.4).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: categoryName,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SetHeaderTitle title={categoryName} />
      {/* Organic-landing demand capture (PRD-03 §7): fired AFTER hydration,
          never in the SSR request path, carrying the area's pincode context. */}
      <TrackView
        eventType="category.viewed"
        categoryId={categoryId}
        pincode={pincode || undefined}
      />
      <h1 className="page-title">{categoryName}</h1>

      {/* RFQ entry point — must never be buried (PRD-02 §3.6 / PRD-03 §4.4). */}
      <Link href={`/rfq/new?category=${categoryId}`} className="banner">
        <ClipboardList size={18} />
        <span style={{ flex: 1 }}>
          {st('categoryPage.cantFind')} {st('categoryPage.postRequirement')}
        </span>
        <ArrowRight size={18} />
      </Link>

      {items.length === 0 ? (
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
        items.map((item) => (
          <div key={item.id} className="card">
            <strong>{item.title}</strong>
            <div className="meta">
              {st('categoryPage.estimate', {
                price: money(item.priceEstimate),
                unit: item.unit,
              })}
              {item.supplier
                ? `  ·  ${st('categoryPage.supplier', {
                    name: item.supplier.businessName,
                  })}`
                : ''}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <AddToTruck catalogItemId={item.id} />
              <Link href={`/rfq/new?category=${categoryId}`} style={{ flex: 1 }}>
                <button className="primary">{st('categoryPage.postRequirement')}</button>
              </Link>
            </div>
          </div>
        ))
      )}
    </>
  );
}
