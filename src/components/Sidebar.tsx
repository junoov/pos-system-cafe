'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutGrid,
  Bookmark,
  FileText,
  User,
  Settings,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { logout } from '@/lib/actions/auth-actions';

export default function Sidebar() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const activeClass = "text-brand-400 bg-brand-50/50";
  const inactiveClass = "text-ui-muted hover:text-gray-800 hover:bg-gray-50";
  const iconActive = "text-brand-400";
  const iconInactive = "group-hover:text-brand-400";

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-ui-border flex flex-col h-full z-20">
      {/* Logo */}
      <div className="px-8 pt-10 pb-6 flex items-center">
        <span className="text-2xl font-bold tracking-tight font-display">
          <span className="text-brand-400">Purr&apos;</span>
          <span className="text-ui-text">Coffee</span>
        </span>
      </div>

      {/* User Profile */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="relative flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60"
              alt="Cashier"
              className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-0.5 font-display">
              Cashier
            </p>
            <p className="text-sm font-bold text-ui-text truncate font-display">
              Kasir Aktif
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 flex flex-col gap-1">
        <Link
          href="/"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium group ${
            isActive('/') ? activeClass : inactiveClass
          }`}
        >
          <Home className={`w-5 h-5 ${isActive('/') ? iconActive : iconInactive}`} />
          <span className="text-sm">Kasir</span>
        </Link>
        <Link
          href="/menu"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium group ${
            isActive('/menu') ? activeClass : inactiveClass
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${isActive('/menu') ? iconActive : iconInactive}`} />
          <span className="text-sm">Kelola Menu</span>
        </Link>
        <Link
          href="/orders"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium group relative ${
            isActive('/orders') ? activeClass : inactiveClass
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isActive('/orders') ? iconActive : iconInactive}`} />
          <span className="text-sm">Pesanan</span>
          <span className="ml-auto w-6 h-5 bg-brand-400 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
            {itemCount}
          </span>
        </Link>
        <Link
          href="/history"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium group ${
            isActive('/history') ? activeClass : inactiveClass
          }`}
        >
          <FileText className={`w-5 h-5 ${isActive('/history') ? iconActive : iconInactive}`} />
          <span className="text-sm">Riwayat</span>
        </Link>

        <div className="my-6 border-t border-gray-100 mx-4"></div>

        <Link
          href="/partners"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium group ${
            isActive('/partners') ? activeClass : inactiveClass
          }`}
        >
          <User className={`w-5 h-5 ${isActive('/partners') ? iconActive : iconInactive}`} />
          <span className="text-sm">Partner</span>
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium group ${
            isActive('/settings') ? activeClass : inactiveClass
          }`}
        >
          <Settings className={`w-5 h-5 ${isActive('/settings') ? iconActive : iconInactive}`} />
          <span className="text-sm">Pengaturan</span>
          <ChevronDown className="ml-auto w-4 h-4 opacity-50" />
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 mt-auto">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-4 px-4 py-3 rounded-xl w-full text-ui-muted hover:text-red-500 hover:bg-red-50 transition-all font-medium group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
