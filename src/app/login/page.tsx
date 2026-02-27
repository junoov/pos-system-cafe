'use client';

import { useTransition, useState } from 'react';
import { Coffee, Lock, Mail } from 'lucide-react';
import { login } from '@/lib/actions/auth-actions';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    const form = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        await login(form);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat login');
      }
    });
  };

  return (
    <div className="min-h-screen bg-ui-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-ui-border">
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <Coffee className="w-8 h-8 text-brand-500" />
          </div>
          
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-ui-text mb-2">
            Purr'<span className="text-brand-500">Coffee</span>
          </h1>
          <p className="text-ui-muted text-sm font-medium">Masuk untuk mengakses sistem Kasir POS.</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 pt-0 space-y-5">
          {errorMessage && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl font-medium border border-red-100 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0"></span>
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-ui-muted" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-ui-text text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="Alamat Email (cth: admin@purrcoffee.local)"
                defaultValue="admin@purrcoffee.local"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-ui-muted" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-ui-text text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                placeholder="Password (cth: admin123)"
                defaultValue="admin123"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none disabled:bg-brand-300 transition-all active:scale-[0.98]"
            >
              {isPending ? 'Memproses...' : 'Masuk Sekarang'}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-ui-muted text-xs mt-10 font-medium">
        &copy; {new Date().getFullYear()} Purr'Coffee System. All rights reserved.
      </p>
    </div>
  );
}
