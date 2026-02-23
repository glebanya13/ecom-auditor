import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogoIcon, UserIcon, SettingsIcon, ChartIcon, AlertIcon } from './Icons';

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
  activeNav?: 'overview' | 'users' | 'tickets' | 'settings';
}

const navItems = [
  { key: 'overview',  label: 'Обзор',          href: '/dashboard/admin',         icon: ChartIcon },
  { key: 'users',     label: 'Пользователи',   href: '/dashboard/admin/users',   icon: UserIcon },
  { key: 'tickets',   label: 'Заявки',         href: '/dashboard/admin/tickets', icon: AlertIcon, badge: true },
];

export default function AdminLayout({ title, children, activeNav }: AdminLayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openTickets, setOpenTickets] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/v1/admin/tickets?status=open&limit=1', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setOpenTickets(data.total ?? 0); })
      .catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>{title} — Админ | E-Com Auditor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/dashboard/admin" className="flex items-center gap-2 flex-shrink-0">
                <LogoIcon size={36} />
                <div className="hidden sm:block">
                  <span className="font-bold text-lg text-gray-900">E-Com Auditor</span>
                  <span className="ml-2 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Admin</span>
                </div>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex gap-1 items-center">
                {navItems.map(({ key, label, href, icon: Icon, badge }) => {
                  const active = activeNav === key;
                  return (
                    <Link
                      key={key}
                      href={href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        active
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-purple-600' : 'text-gray-400'} />
                      {label}
                      {badge && openTickets !== null && openTickets > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {openTickets > 99 ? '99+' : openTickets}
                        </span>
                      )}
                    </Link>
                  );
                })}
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
                {navItems.map(({ key, label, href, icon: Icon, badge }) => {
                  const active = activeNav === key;
                  return (
                    <Link
                      key={key}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                        active ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-purple-600' : 'text-gray-400'} />
                      {label}
                      {badge && openTickets !== null && openTickets > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          {openTickets}
                        </span>
                      )}
                    </Link>
                  );
                })}
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
