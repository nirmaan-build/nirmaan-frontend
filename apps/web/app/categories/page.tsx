import Link from 'next/link';
import { Package } from 'lucide-react';
import { serverApi, serverLocale } from '@/lib/serverApi';
import { st } from '@/lib/i18n-server';
import { SearchBox } from '../components/SearchBox';
import type { Category } from '@/lib/types';

// SSR — search-first categories page (PRD-03 §4.3, §5).
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const locale = serverLocale();
  // Categories are semi-static — cache for 5 min at the data layer.
  const categories =
    (await serverApi<Category[]>(`/categories?locale=${locale}`, { revalidate: 300 })) ?? [];

  return (
    <>
      <h1>{st('categories.title')}</h1>
      <div className="page-search">
        <SearchBox placeholder={st('categories.searchPlaceholder')} />
      </div>

      <h2>{st('categories.browseAll')}</h2>
      {categories.length === 0 ? (
        <p className="muted">{st('categories.empty')}</p>
      ) : (
        <div className="grid">
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.id}`} className="chip">
              <span className="ic"><Package size={22} /></span>
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
