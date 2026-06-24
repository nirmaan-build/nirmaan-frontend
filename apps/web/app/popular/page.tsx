import { st } from '@/lib/i18n-server';
import { serverApi, serverPincode } from '@/lib/serverApi';
import { PopularSearch } from '../components/PopularSearch';
import type { CatalogSearchResult } from '@/lib/types';

// SSR — full "Popular near you" list for the area; PopularSearch adds a local filter.
export const dynamic = 'force-dynamic';

export default async function PopularPage() {
  const pincode = serverPincode();
  const catalog = pincode
    ? await serverApi<CatalogSearchResult>(`/catalog?pincode=${pincode}`)
    : null;
  const items = catalog?.items ?? [];

  return (
    <>
      <h1 className="page-title">{st('home.popularNearYou')}</h1>
      <PopularSearch items={items} />
    </>
  );
}
