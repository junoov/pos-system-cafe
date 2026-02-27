'use client';

import { useMemo, useState } from 'react';
import {
  CakeSlice,
  Coffee,
  Cookie,
  CupSoda,
  Flame,
  LayoutGrid,
  Milk,
  Search,
  Snowflake,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

import { useCart } from '@/lib/cart-context';
import { formatRupiah } from '@/lib/format';
import type { Category, Product } from '@/lib/types';

type PosCatalogProps = {
  categories: Category[];
  products: Product[];
};

type ProductOptionState = {
  mood: 'hot' | 'cold';
  size: 'S' | 'M' | 'L';
  sugarLevel: 30 | 50 | 70;
  iceLevel: 30 | 50 | 70;
};

const iconMap: Record<string, LucideIcon> = {
  Coffee,
  CupSoda,
  Milk,
  Cookie,
  CakeSlice,
  Utensils,
};

const iconColorMap: Record<string, string> = {
  Coffee: 'text-brand-400',
  CupSoda: 'text-brand-400',
  Milk: 'text-blue-300',
  Cookie: 'text-amber-500',
  CakeSlice: 'text-pink-400',
  Utensils: 'text-green-500',
};

function getCategoryIcon(name: string | null) {
  if (!name) {
    return LayoutGrid;
  }

  return iconMap[name] ?? LayoutGrid;
}

function getCategoryIconClass(name: string | null) {
  if (!name) {
    return 'text-ui-muted opacity-70';
  }

  return iconColorMap[name] ?? 'text-brand-400';
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [options, setOptions] = useState<ProductOptionState>({
    mood: 'hot',
    size: 'M',
    sugarLevel: 50,
    iceLevel: 50,
  });

  const isDisabled = !product.isAvailable || product.stockQty <= 0;

  return (
    <article className="bg-white rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full border border-transparent hover:border-brand-100">
      <div className="flex gap-4 mb-5">
        <div className="w-[110px] h-[130px] bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
          <img
            src={
              product.imageUrl ||
              'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60'
            }
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col py-1 min-w-0">
          <h3 className="font-bold text-ui-text leading-tight mb-2 text-[17px] break-words">
            {product.name}
          </h3>
          <p className="text-[11px] text-ui-muted leading-relaxed line-clamp-2 pr-2">
            {product.description || 'Menu favorit pelanggan cafe.'}
          </p>
          <div className="mt-auto font-bold text-xl text-ui-text">{formatRupiah(product.price)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-6">
        <div>
          <span className="block text-xs font-semibold text-ui-text mb-2.5">Mood</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOptions((current) => ({ ...current, mood: 'hot' }))}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                options.mood === 'hot'
                  ? 'border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100'
                  : 'border-transparent text-brand-300 hover:bg-brand-50'
              }`}
            >
              <Flame className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setOptions((current) => ({ ...current, mood: 'cold' }))}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                options.mood === 'cold'
                  ? 'border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100'
                  : 'border-transparent text-blue-300 hover:bg-blue-50'
              }`}
            >
              <Snowflake className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold text-ui-text mb-2.5">Size</span>
          <div className="flex gap-2">
            {(['S', 'M', 'L'] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setOptions((current) => ({ ...current, size }))}
                className={`w-10 h-10 rounded-full text-sm font-bold transition-colors ${
                  options.size === size
                    ? 'border border-gray-200 text-ui-text shadow-sm'
                    : 'text-ui-muted hover:bg-gray-100'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <span className="block text-xs font-semibold text-ui-text mb-2.5">Sugar</span>
          <div className="flex gap-2">
            {([30, 50, 70] as const).map((value) => {
              const isActive = options.sugarLevel === value;
              const activeClass =
                value === 70
                  ? 'bg-red-50 text-red-600'
                  : 'bg-brand-50 text-brand-700';

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOptions((current) => ({ ...current, sugarLevel: value }))}
                  className={`px-4 h-[38px] rounded-full text-xs font-bold transition-colors ${
                    isActive
                      ? activeClass
                      : 'border border-gray-200 text-ui-muted hover:bg-gray-50'
                  }`}
                >
                  {value}%
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-2">
          <span className="block text-xs font-semibold text-ui-text mb-2.5">Ice</span>
          <div className="flex gap-2">
            {([30, 50, 70] as const).map((value) => {
              const isActive = options.iceLevel === value;
              const activeClass =
                value === 70
                  ? 'bg-red-50 text-red-600'
                  : 'bg-brand-50 text-brand-700';

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOptions((current) => ({ ...current, iceLevel: value }))}
                  className={`px-4 h-[38px] rounded-full text-xs font-bold transition-colors ${
                    isActive
                      ? activeClass
                      : 'border border-gray-200 text-ui-muted hover:bg-gray-50'
                  }`}
                >
                  {value}%
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-full mt-auto bg-brand-400 text-white font-bold py-4 rounded-full hover:bg-brand-500 transition-all text-sm shadow-sm flex items-center justify-center active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed"
        disabled={isDisabled}
        onClick={() =>
          addItem({
            product,
            options: {
              mood: options.mood,
              size: options.size,
              sugarLevel: options.sugarLevel,
              iceLevel: options.iceLevel,
            },
          })
        }
      >
        {isDisabled ? 'Stok Habis' : 'Tambah ke Pesanan'}
      </button>
    </article>
  );
}

export default function PosCatalog({ categories, products }: PosCatalogProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (activeCategoryId && product.categoryId !== activeCategoryId) {
        return false;
      }

      if (!search.trim()) {
        return true;
      }

      const query = search.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.categoryName.toLowerCase().includes(query) ||
        (product.description ?? '').toLowerCase().includes(query)
      );
    });
  }, [activeCategoryId, products, search]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? null,
    [activeCategoryId, categories],
  );

  return (
    <div className="flex-1 overflow-y-auto w-full p-8 pb-10">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center mb-10 mt-2 gap-4">
        <h1 className="text-[28px] font-bold text-ui-text tracking-tight font-display">Choose Category</h1>

        <div className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Search category or menu..."
            className="w-full bg-white border border-transparent rounded-full py-3.5 pl-5 pr-12 text-sm text-ui-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent transition-all placeholder-brand-300"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700"
          >
            <Search className="w-4 h-4 text-brand-700" />
          </button>
        </div>
      </header>

      <div className="flex gap-4 overflow-x-auto hide-scroll pb-2 mb-10">
        <button
          type="button"
          onClick={() => setActiveCategoryId(null)}
          className={`flex flex-col items-center justify-center w-20 h-[92px] rounded-[20px] bg-white transition-all flex-shrink-0 border ${
            activeCategoryId === null
              ? 'border-brand-400 shadow-md text-brand-400'
              : 'border-transparent shadow-sm text-ui-muted hover:shadow-md hover:text-brand-700'
          }`}
        >
          <div className="w-10 h-10 mb-2 flex items-center justify-center text-brand-200">
            <LayoutGrid
              className={`w-6 h-6 ${
                activeCategoryId === null
                  ? 'text-brand-400'
                  : 'text-ui-muted opacity-70'
              }`}
            />
          </div>
          <span className="text-[11px] font-semibold">All</span>
        </button>

        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;
          const Icon = getCategoryIcon(category.icon);
          const iconClass = getCategoryIconClass(category.icon);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={`flex flex-col items-center justify-center w-20 h-[92px] rounded-[20px] bg-white transition-all flex-shrink-0 relative border ${
                isActive
                  ? 'border-brand-400 shadow-md text-brand-400'
                  : 'border-transparent shadow-sm text-ui-muted hover:shadow-md hover:text-brand-700'
              }`}
            >
              <div className="w-10 h-10 mb-2 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${iconClass}`} />
              </div>
              <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-semibold'}`}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-end mb-6">
        <h2 className="text-[22px] font-bold text-ui-text font-display">
          {activeCategory ? `${activeCategory.name} Menu` : 'All Menu'}
        </h2>
        <span className="text-sm font-bold text-ui-muted font-display">
          {filteredProducts.length} Result
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-ui-border p-8 text-center text-ui-muted">
          Produk tidak ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
