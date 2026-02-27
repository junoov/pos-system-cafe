import {
  createPartnerFromForm,
  deletePartnerFromForm,
  getPartners,
} from '@/lib/actions/partner-actions';

export const dynamic = 'force-dynamic';

export default async function PartnersPage() {
  const partners = await getPartners();

  return (
    <div className="flex-1 overflow-y-auto w-full p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-display text-ui-text">Partner & Supplier</h1>
        <p className="text-sm text-ui-muted mt-1">Kelola mitra bahan baku dan kontak vendor.</p>
      </header>

      <section className="bg-white border border-ui-border rounded-2xl p-5">
        <h2 className="text-lg font-semibold mb-4">Tambah Partner</h2>
        <form action={createPartnerFromForm} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            name="name"
            placeholder="Nama partner"
            required
            className="px-3 py-2 rounded-xl border border-ui-border"
          />
          <input
            name="contact"
            placeholder="Kontak"
            className="px-3 py-2 rounded-xl border border-ui-border"
          />
          <input
            name="address"
            placeholder="Alamat"
            className="px-3 py-2 rounded-xl border border-ui-border"
          />
          <button
            type="submit"
            className="md:col-span-3 justify-self-start px-4 py-2 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800"
          >
            Simpan Partner
          </button>
        </form>
      </section>

      <section className="bg-white border border-ui-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ui-border">
          <h2 className="text-lg font-semibold">Daftar Partner</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-ui-bg">
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kontak</th>
                <th className="px-4 py-3">Alamat</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ui-muted">
                    Belum ada partner.
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="border-t border-ui-border">
                    <td className="px-4 py-3 font-semibold">{partner.name}</td>
                    <td className="px-4 py-3">{partner.contact || '-'}</td>
                    <td className="px-4 py-3">{partner.address || '-'}</td>
                    <td className="px-4 py-3">
                      <form action={deletePartnerFromForm}>
                        <input type="hidden" name="id" value={partner.id} />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
