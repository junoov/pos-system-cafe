import { createProductFromForm, deleteProductFromForm, getProducts } from '@/lib/actions/product-actions';
import { getCategories } from '@/lib/actions/category-actions';
import { updateStockFromForm } from '@/lib/actions/stock-actions';
import { formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts({ outletId: 1 })]);

  return (
    <div className="flex-1 overflow-y-auto w-full p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold font-display text-ui-text">Kelola Menu</h1>
        <p className="text-sm text-ui-muted mt-1">Tambah, ubah, dan atur stok produk.</p>
      </header>

      <section className="bg-white border border-ui-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold mb-4">Tambah Produk Baru</h2>
        <form action={createProductFromForm} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <input
            name="name"
            placeholder="Nama produk"
            className="px-3 py-2 rounded-xl border border-ui-border"
            required
          />
          <input
            name="price"
            type="number"
            min={0}
            step="100"
            placeholder="Harga"
            className="px-3 py-2 rounded-xl border border-ui-border"
            required
          />
          <select name="categoryId" className="px-3 py-2 rounded-xl border border-ui-border" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            name="stockQty"
            type="number"
            min={0}
            placeholder="Stok awal"
            className="px-3 py-2 rounded-xl border border-ui-border"
            defaultValue={0}
          />
          <input
            name="minStock"
            type="number"
            min={0}
            placeholder="Minimum stok"
            className="px-3 py-2 rounded-xl border border-ui-border"
            defaultValue={0}
          />
          <input
            name="imageFile"
            type="file"
            accept="image/*"
            className="px-3 py-2 rounded-xl border border-ui-border bg-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          <input
            name="description"
            placeholder="Deskripsi singkat"
            className="px-3 py-2 rounded-xl border border-ui-border md:col-span-2"
          />

          <input type="hidden" name="isAvailable" value="1" />
          <input type="hidden" name="outletId" value="1" />

          <button
            type="submit"
            className="bg-brand-700 text-white font-semibold rounded-xl px-4 py-2 hover:bg-brand-800"
          >
            Simpan Produk
          </button>
        </form>
      </section>

      <section className="bg-white border border-ui-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ui-border flex justify-between items-center">
          <h2 className="text-lg font-semibold">Daftar Produk & Stok</h2>
          <span className="text-sm text-ui-muted">{products.length} produk</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-ui-bg">
                <th className="px-4 py-3 font-semibold">Produk</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Harga</th>
                <th className="px-4 py-3 font-semibold">Stok</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-ui-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ui-text">{product.name}</p>
                    <p className="text-ui-muted text-xs">{product.description || '-'}</p>
                  </td>
                  <td className="px-4 py-3">{product.categoryName}</td>
                  <td className="px-4 py-3">{formatRupiah(product.price)}</td>
                  <td className="px-4 py-3">
                    <form action={updateStockFromForm} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="outletId" value="1" />
                      <input
                        type="number"
                        name="stockQty"
                        min={0}
                        defaultValue={product.stockQty}
                        className="w-20 px-2 py-1 rounded-lg border border-ui-border"
                      />
                      <input
                        type="number"
                        name="minStock"
                        min={0}
                        defaultValue={product.minStock}
                        className="w-20 px-2 py-1 rounded-lg border border-ui-border"
                      />
                      <input type="hidden" name="note" value="Update stok dari halaman menu" />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-semibold hover:bg-brand-100"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteProductFromForm}>
                      <input type="hidden" name="id" value={product.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
