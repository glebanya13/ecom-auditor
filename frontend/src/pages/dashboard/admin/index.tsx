import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import AdminLayout from '../../../components/AdminLayout';
import { UserIcon, AlertIcon, ChartIcon, WalletIcon, PackageIcon, DocumentIcon, LockIcon } from '../../../components/Icons';

interface Stats {
  total_users: number;
  active_users: number;
  pro_users: number;
  total_products: number;
  total_audits: number;
  open_tickets: number;
  total_balance: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.FC<{ size?: number; className?: string }>;
  iconBg: string;
  href?: string;
}) {
  const content = (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token') || '';
    if (!token) { router.push('/login'); return; }

    fetch('/api/v1/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 403) { setAccessDenied(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => { if (data) setStats(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <LockIcon size={64} className="mx-auto mb-4 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Нет доступа</h1>
        <p className="text-gray-500">Эта страница доступна только администраторам.</p>
      </div>
    );
  }

  return (
    <AdminLayout title="Обзор" activeNav="overview">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Обзор системы</h1>
        <p className="text-gray-500 text-sm">Ключевые метрики в реальном времени</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Пользователей"
          value={stats?.total_users ?? '—'}
          sub={`${stats?.active_users ?? 0} активных`}
          icon={UserIcon}
          iconBg="bg-blue-100 text-blue-600"
          href="/dashboard/admin/users"
        />
        <StatCard
          label="Pro подписок"
          value={stats?.pro_users ?? '—'}
          sub={`из ${stats?.total_users ?? 0}`}
          icon={ChartIcon}
          iconBg="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Товаров"
          value={stats?.total_products ?? '—'}
          sub="всего в системе"
          icon={PackageIcon}
          iconBg="bg-orange-100 text-orange-600"
        />
        <StatCard
          label="Аудитов"
          value={stats?.total_audits ?? '—'}
          sub="всего проведено"
          icon={DocumentIcon}
          iconBg="bg-green-100 text-green-600"
        />
        <StatCard
          label="Открытых заявок"
          value={stats?.open_tickets ?? '—'}
          sub="требуют ответа"
          icon={AlertIcon}
          iconBg={stats?.open_tickets ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}
          href="/dashboard/admin/tickets"
        />
        <StatCard
          label="Общий баланс"
          value={stats ? `${stats.total_balance.toLocaleString('ru-RU')} ₽` : '—'}
          sub="у всех пользователей"
          icon={WalletIcon}
          iconBg="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/admin/users', icon: UserIcon, label: 'Пользователи', desc: 'Управление аккаунтами и балансами', iconBg: 'bg-blue-100 text-blue-600' },
          { href: '/dashboard/admin/tickets', icon: AlertIcon, label: 'Заявки', desc: 'Баги, обращения, обратная связь', iconBg: 'bg-red-100 text-red-600' },
          { href: '/dashboard/settings', icon: ChartIcon, label: 'Настройки', desc: 'Профиль и API ключи', iconBg: 'bg-purple-100 text-purple-600' },
        ].map(({ href, icon: Icon, label, desc, iconBg }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} mb-3`}>
              <Icon size={20} />
            </div>
            <div className="font-semibold text-gray-900 mb-1">{label}</div>
            <div className="text-sm text-gray-500">{desc}</div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
