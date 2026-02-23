import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogoIcon } from './Icons';

interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
  activeNav?: 'dashboard' | 'products' | 'analytics' | 'settings' | 'admin';
}

// Обычные пользователи
const userNavItems = [
  { key: 'dashboard', label: 'Дашборд', href: '/dashboard' },
  { key: 'products', label: 'Товары', href: '/dashboard/products' },
  { key: 'analytics', label: 'Аналитика', href: '/dashboard/analytics' },
  { key: 'settings', label: 'Настройки', href: '/dashboard/settings' },
];

export default function DashboardLayout({ title, children, activeNav }: DashboardLayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(me => { if (me?.is_verified) setIsAdmin(true); })
      .catch(() => {});
  }, []);

  const navItems = userNavItems;

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>{title} - E-Com Auditor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
                <LogoIcon size={36} />
                <span className="font-bold text-lg text-gray-900 hidden sm:block">E-Com Auditor</span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex gap-6 items-center">
                {navItems.map(item => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`font-medium text-sm pb-1 transition-colors ${
                      activeNav === item.key
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : (item as { highlight?: boolean }).highlight
                        ? 'text-yellow-600 hover:text-yellow-700 border border-yellow-300 rounded-lg px-2.5 py-1 pb-1 text-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                {/* Logout - desktop */}
                <button
                  onClick={handleLogout}
                  className="hidden md:block text-gray-600 hover:text-gray-900 font-medium text-sm px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  Выйти
                </button>

                {/* Hamburger - mobile */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  aria-label="Меню"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
              <nav className="px-4 py-3 space-y-1">
                {navItems.map(item => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                      activeNav === item.key
                        ? 'bg-purple-50 text-purple-700'
                        : (item as { highlight?: boolean }).highlight
                        ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Выйти
                </button>
              </nav>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </>
  );
}
