import PosCatalog from '@/components/PosCatalog';
import { getCategories } from '@/lib/actions/category-actions';
import { getProducts } from '@/lib/actions/product-actions';

export const dynamic = 'force-dynamic';

export default async function PosPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ outletId: 1, onlyAvailable: true }),
  ]);

  return <PosCatalog categories={categories} products={products} />;
}
