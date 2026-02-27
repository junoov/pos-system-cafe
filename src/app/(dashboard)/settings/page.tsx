
import {
  createOutletFromForm,
  getOutlets,
  getSettings,
  updateSettingFromForm,
} from '@/lib/actions/settings-actions';

export const dynamic = 'force-dynamic';

function SettingForm({
  label,
  settingKey,
  value,
  type = 'text',
}: {
  label: string;
  settingKey: string;
  value: string;
  type?: string;
}) {
  return (
    <form action={updateSettingFromForm} className="space-y-2">
      <label className="block text-sm font-medium text-ui-text">{label}</label>
      <div className="flex gap-2">
        <input
          type={type}
          name="value"
          defaultValue={value}
          className="flex-1 px-3 py-2 rounded-xl border border-ui-border"
          required
        />
        <input type="hidden" name="outletId" value="1" />
        <input type="hidden" name="key" value={settingKey} />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800"
        >
          Simpan
        </button>
      </div>
    </form>
  );
}

export default async function SettingsPage() {
  const [settings, outlets] = await Promise.all([getSettings(1), getOutlets()]);

  return (
    <div className="flex-1 overflow-y-auto w-full p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-display text-ui-text">Pengaturan</h1>
        <p className="text-sm text-ui-muted mt-1">Atur informasi toko, pajak, outlet, dan user kasir.</p>
      </header>

      <section className="bg-white border border-ui-border rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">Informasi Toko</h2>
        <SettingForm label="Nama Toko" settingKey="store_name" value={settings.store_name || ''} />
        <SettingForm
          label="Alamat Toko"
          settingKey="store_address"
          value={settings.store_address || ''}
        />
        <SettingForm label="Telepon" settingKey="store_phone" value={settings.store_phone || ''} />
        <SettingForm label="Tarif Pajak (%)" settingKey="tax_rate" value={settings.tax_rate || '10'} type="number" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="bg-white border border-ui-border rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Multi Outlet</h2>
          <form action={createOutletFromForm} className="grid grid-cols-1 gap-2">
            <input
              name="name"
              placeholder="Nama outlet"
              required
              className="px-3 py-2 rounded-xl border border-ui-border"
            />
            <input
              name="address"
              placeholder="Alamat"
              className="px-3 py-2 rounded-xl border border-ui-border"
            />
            <input
              name="phone"
              placeholder="Telepon"
              className="px-3 py-2 rounded-xl border border-ui-border"
            />
            <button
              type="submit"
              className="justify-self-start px-4 py-2 rounded-xl bg-brand-700 text-white font-semibold hover:bg-brand-800"
            >
              Tambah Outlet
            </button>
          </form>

          <ul className="space-y-2 text-sm">
            {outlets.map((outlet) => (
              <li key={outlet.id} className="rounded-xl border border-ui-border px-3 py-2">
                <p className="font-semibold">{outlet.name}</p>
                <p className="text-ui-muted">{outlet.address || '-'}</p>
                <p className="text-ui-muted">{outlet.phone || '-'}</p>
              </li>
            ))}
          </ul>
        </article>

      </section>
    </div>
  );
}
