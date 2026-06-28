import Link from 'next/link';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { serverApi, serverLocale, serverPincode } from '@/lib/serverApi';
import { st } from '@/lib/i18n-server';
import { SetHeaderTitle } from '../../components/HeaderTitle';
import { TrackView } from '../../components/TrackView';
import { SupplierList } from '../../components/SupplierList';
import type { Category } from '@/lib/types';
import type { SupplierRow } from '../../components/SupplierList';

// SSR — supplier browse for a category (PRD-03 §4.4). slug = categoryId.
export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const locale = serverLocale();
  const pincode = serverPincode();
  const categoryId = params.slug;

  // Build supplier query — at minimum filter by category; add pincode if known.
  const supplierQs = [`categoryId=${categoryId}`, pincode ? `pincode=${pincode}` : '']
    .filter(Boolean)
    .join('&');

  const [categories, suppliers] = await Promise.all([
    serverApi<Category[]>(`/categories?locale=${locale}`, { revalidate: 300 }),
    serverApi<SupplierRow[]>(`/suppliers?${supplierQs}`),
  ]);

  const categoryName =
    categories?.find((c) => c.id === categoryId)?.name ?? st('categories.title');

  return (
    <>
      <SetHeaderTitle title={categoryName} />
      <TrackView
        eventType="category.viewed"
        categoryId={categoryId}
        pincode={pincode || undefined}
      />
      <h1 className="page-title">{categoryName}</h1>

      {/* RFQ entry — always visible at top (PRD-02 §3.6 / PRD-03 §4.4). */}
      <Link href={`/rfq/new?category=${categoryId}`} className="banner">
        <ClipboardList size={18} />
        <span style={{ flex: 1 }}>
          {st('categoryPage.cantFind')} {st('categoryPage.postRequirement')}
        </span>
        <ArrowRight size={18} />
      </Link>

      <SupplierList suppliers={suppliers ?? []} slug={params.slug} />
    </>
  );
}
