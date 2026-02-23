import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';
import { WildberriesIcon, OzonIcon, StarFilledIcon, AlertIcon, CheckIcon } from '../../../components/Icons';

interface Product {
  id: number;
  sku_id: string;
  marketplace: string;
  name: string;
  current_price: number | null;
  rating: number | null;
  shadow_ban_detected: boolean;
  certificate_expired: boolean;
  marking_issues: boolean;
  certificate_number: string | null;
  certificate_status: string | null;
  delivery_time_hours: number | null;
  warehouse_location: string | null;
  description: string | null;
}

interface AuditResult {
  id: number;
  audit_type: string;
  audit_date: string;
  scores: {
    total_score: number;
    legal_score: number;
    delivery_score: number;
    seo_score: number;
    price_score: number;
  };
  recommendations: string[];
  margin_percentage: number | null;
  estimated_profit: number | null;
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState<Product | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }

    fetch(`/api/v1/products/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/login');
          return null;
        }
        if (r.status === 404) { router.push('/dashboard'); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => { if (data) setProduct(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleRefresh = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !product) return;

    try {
      const res = await fetch(`/api/v1/products/${product.id}/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem('access_token'); router.push('/login'); return; }
      if (res.ok) {
        // Re-fetch product after short delay for background task to complete
        setTimeout(async () => {
          const updated = await fetch(`/api/v1/products/${product.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (updated.ok) setProduct(await updated.json());
        }, 3000);
      }
    } catch {
      console.error('Ошибка обновления данных');
    }
  };

  const handleRunAudit = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !product) return;

    setAuditing(true);
    setAuditError('');

    try {
      const res = await fetch('/api/v1/audit/full', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, audit_type: 'full' }),
      });
      if (res.ok) {
        setAuditResult(await res.json());
      } else {
        const err = await res.json();
        setAuditError(err.detail || 'Ошибка при запуске аудита');
      }
    } catch {
      setAuditError('Ошибка соединения с сервером');
    } finally {
      setAuditing(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !confirm('Удалить этот товар из мониторинга?')) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setDeleteError('');
    try {
      const res = await fetch(`/api/v1/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }
      if (res.status === 204) {
        router.push('/dashboard');
      } else {
        setDeleteError('Не удалось удалить товар. Попробуйте ещё раз.');
      }
    } catch {
      setDeleteError('Ошибка соединения с сервером.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Отличный';
    if (score >= 40) return 'Есть проблемы';
    return 'Критические риски';
  };

  // Certificate status: green if valid, red if explicitly expired/invalid, gray if unknown/null
  const getCertBadge = (status: string | null) => {
    if (status === 'valid') {
      return { bg: 'bg-green-100 text-green-700', icon: <CheckIcon size={14} />, label: 'Действителен' };
    }
    if (status === 'expired' || status === 'invalid') {
      return { bg: 'bg-red-100 text-red-700', icon: <AlertIcon size={14} />, label: 'Проблема' };
    }
    // null / unknown — neutral gray
    return { bg: 'bg-gray-100 text-gray-500', icon: null, label: 'Статус неизвестен' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (!product) return null;

  const certBadge = getCertBadge(product.certificate_status);

  return (
    <DashboardLayout title={product.name || product.sku_id} activeNav="products">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <Link href="/dashboard" className="hover:text-gray-700">Дашборд</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{product.name || product.sku_id}</span>
      </div>

      {/* Product Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                product.marketplace === 'wildberries' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {product.marketplace === 'wildberries' ? (
                  <><WildberriesIcon size={14} className="inline mr-1" />Wildberries</>
                ) : (
                  <><OzonIcon size={14} className="inline mr-1" />Ozon</>
                )}
              </span>
              {(product.shadow_ban_detected || product.certificate_expired || product.marking_issues) ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><AlertIcon size={12} /> Проблемы</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckIcon size={12} /> OK</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{product.name || 'Без названия'}</h1>
            <p className="text-sm text-gray-400">SKU: {product.sku_id}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={handleRefresh} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
              Обновить
            </button>
            <button onClick={handleDelete} className="text-red-400 hover:text-red-600 text-sm font-medium">
              Удалить
            </button>
          </div>
        </div>

        {deleteError && (
          <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {deleteError}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Цена', value: product.current_price ? `${product.current_price.toFixed(0)}₽` : '—' },
            { label: 'Рейтинг', value: product.rating ? product.rating.toFixed(1) : '—', isRating: !!product.rating },
            { label: 'Доставка', value: product.delivery_time_hours ? `${product.delivery_time_hours}ч` : '—' },
            { label: 'Склад', value: product.warehouse_location || '—' },
          ].map(({ label, value, isRating }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {isRating ? (
                  <span className="inline-flex items-center gap-1"><StarFilledIcon size={14} className="text-amber-400" />{value}</span>
                ) : value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificate */}
      {product.certificate_number && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Сертификат</h2>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-gray-400 mb-1">Номер</div>
              <div className="font-mono text-sm text-gray-900 truncate">{product.certificate_number}</div>
            </div>
            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${certBadge.bg}`}>
              {certBadge.icon}
              {certBadge.label}
            </span>
          </div>
        </div>
      )}

      {/* Audit */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Полный аудит</h2>
            <p className="text-xs text-gray-400 mt-0.5">Юридика, SEO, доставка, цены</p>
          </div>
          <button
            onClick={handleRunAudit}
            disabled={auditing}
            className="w-full sm:w-auto px-5 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
          >
            {auditing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Проверяем...
              </>
            ) : 'Запустить аудит'}
          </button>
        </div>

        {auditError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
            {auditError}
          </div>
        )}

        {auditResult && (
          <div className="border-t border-gray-100 pt-5">
            {/* Score */}
            <div className="flex items-center gap-5 mb-5">
              <div className="text-center flex-shrink-0">
                <div className={`text-4xl sm:text-5xl font-bold ${getScoreColor(auditResult.scores.total_score)}`}>
                  {auditResult.scores.total_score}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">из 100</div>
                <div className={`text-xs font-semibold mt-1 ${getScoreColor(auditResult.scores.total_score)}`}>
                  {getScoreLabel(auditResult.scores.total_score)}
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                {[
                  { label: 'Юридика', value: auditResult.scores.legal_score, max: 40, color: 'bg-blue-500' },
                  { label: 'Доставка', value: auditResult.scores.delivery_score, max: 30, color: 'bg-violet-500' },
                  { label: 'SEO', value: auditResult.scores.seo_score, max: 20, color: 'bg-emerald-500' },
                  { label: 'Цена', value: auditResult.scores.price_score, max: 10, color: 'bg-amber-500' },
                ].map(({ label, value, max, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-700">{value} / {max}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`${color} h-1.5 rounded-full`} style={{ width: `${(value / max) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial */}
            {(auditResult.estimated_profit || auditResult.margin_percentage) && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                {auditResult.estimated_profit && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Расчётная прибыль</div>
                    <div className="text-lg font-bold text-green-700">{auditResult.estimated_profit.toFixed(0)}₽</div>
                  </div>
                )}
                {auditResult.margin_percentage && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Маржа</div>
                    <div className="text-lg font-bold text-blue-700">{auditResult.margin_percentage.toFixed(1)}%</div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {auditResult.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Рекомендации</h3>
                <ul className="space-y-1.5">
                  {auditResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-purple-400 mt-0.5 flex-shrink-0">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
