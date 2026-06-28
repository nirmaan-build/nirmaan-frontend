import { serverApi, serverLocale } from '@/lib/serverApi';
import { st } from '@/lib/i18n-server';
import { CategoryGrid } from '../components/CategoryGrid';
import type { Category } from '@/lib/types';

// SSR — search-first categories page (PRD-03 §4.3, §5).
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const locale = serverLocale();
  const categories =
    (await serverApi<Category[]>(`/categories?locale=${locale}`, { revalidate: 300 })) ?? [];

  return (
    <>
      <h1>{st('categories.title')}</h1>
      <h2>{st('categories.browseAll')}</h2>
      {categories.length === 0 ? (
        <p className="muted">{st('categories.empty')}</p>
      ) : (
        <CategoryGrid categories={categories} />
      )}
    </>
  );
}
