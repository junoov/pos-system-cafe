

import Sidebar from '@/components/Sidebar';
import RightSidebar from '@/components/RightSidebar';
import { getSettings } from '@/lib/actions/settings-actions';
import { toNumber } from '@/lib/format';

import Providers from '../providers';

 

 
export const dynamic = 'force-dynamic';

async function getLayoutSettings() {
  const settings = await getSettings(1);
  return {
    storeName: settings.store_name || 'POS Cafe',
    storeAddress: settings.store_address || '-',
    storePhone: settings.store_phone || '-',
    taxRate: toNumber(settings.tax_rate, 10),
  };
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { storeName, storeAddress, storePhone, taxRate } = await getLayoutSettings();

  return (
    <div className="h-screen w-full flex overflow-hidden bg-ui-bg text-ui-text">
      <Providers initialTaxRate={taxRate} storeName={storeName}>
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">{children}</main>
        <RightSidebar storeAddress={storeAddress} storePhone={storePhone} />
      </Providers>
    </div>
  );
}
