import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';

interface AuditHistory {
  id: number;
  product_id: number;
  audit_type: string;
  audit_date: string;
  scores: {
    total_score: number;
    legal_score: number | null;
    delivery_score: number | null;
    seo_score: number | null;
    price_score: number | null;
  };
  issues_summary: string;
  margin_percentage: number | null;
  estimated_profit: number | null;
}

export default function Analytics() {
  const router = useRouter();
  const [history, setHistory] = useState<AuditHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    fetch('/api/v1/audit/history?limit=20', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/login');
          return [];
        }
        if (!r.ok) return [];
        return r.json();
      })
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Guard against null scores to avoid NaN
  const validTotals = history.filter(h => h.scores.total_score != null);
  const avgScore = validTotals.length > 0
    ? Math.round(validTotals.reduce((sum, h) => sum + h.scores.total_score, 0) / validTotals.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 40) return 'bg-amber-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Аналитика" activeNav="analytics">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Аналитика</h1>
        <p className="text-gray-500 text-sm">История проверок и статистика по товарам</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Всего проверок</div>
          <div className="text-3xl font-bold text-gray-900">{history.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Средний балл</div>
          <div className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Проблемных товаров</div>
          <div className="text-3xl font-bold text-red-600">
            {history.filter(h => h.scores.total_score != null && h.scores.total_score < 40).length}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Средние баллы по категориям</h2>
          <div className="space-y-4">
            {[
              { label: 'Юридическое соответствие', key: 'legal_score' as const, max: 40, color: 'bg-blue-500' },
              { label: 'Доставка', key: 'delivery_score' as const, max: 30, color: 'bg-violet-500' },
              { label: 'SEO и позиции', key: 'seo_score' as const, max: 20, color: 'bg-emerald-500' },
              { label: 'Цена', key: 'price_score' as const, max: 10, color: 'bg-amber-500' },
            ].map(({ label, key, max, color }) => {
              // Use ?? 0 to treat null scores as 0, preventing NaN
              const avg = history.reduce((sum, h) => sum + (h.scores[key] ?? 0), 0) / history.length;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-gray-400">{avg.toFixed(1)} / {max}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`${color} h-2.5 rounded-full`} style={{ width: `${(avg / max) * 100}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">История проверок</h2>
        </div>

        {history.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Нет данных</h3>
            <p className="text-gray-500 text-sm mb-4">Запустите первую проверку товара</p>
            <Link href="/dashboard" className="inline-block bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm">
              Перейти к товарам
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Тип</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Балл</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Прибыль</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Маржа</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Итог</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Товар</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((audit) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(audit.audit_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                          {audit.audit_type === 'full' ? 'Полный' : 'Быстрый'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-bold ${getScoreBg(audit.scores.total_score)} ${getScoreColor(audit.scores.total_score)}`}>
                          {audit.scores.total_score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {audit.estimated_profit != null ? `${audit.estimated_profit.toFixed(0)}₽` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {audit.margin_percentage != null ? `${audit.margin_percentage.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{audit.issues_summary || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/products/${audit.product_id}`}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          Открыть →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {history.map((audit) => (
                <Link
                  key={audit.id}
                  href={`/dashboard/products/${audit.product_id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {new Date(audit.audit_date).toLocaleDateString('ru-RU')}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-sm font-bold ${getScoreBg(audit.scores.total_score)} ${getScoreColor(audit.scores.total_score)}`}>
                      {audit.scores.total_score}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {audit.estimated_profit != null && <span>Прибыль: {audit.estimated_profit.toFixed(0)}₽</span>}
                    {audit.margin_percentage != null && <span>Маржа: {audit.margin_percentage.toFixed(1)}%</span>}
                  </div>
                  <div className="text-xs text-purple-600 mt-1.5 font-medium">Открыть товар →</div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
