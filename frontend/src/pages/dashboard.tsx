import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import { WildberriesIcon, OzonIcon, StarFilledIcon, AlertIcon, CheckIcon } from '../components/Icons';

interface User {
  id: number;
  email: string;
  full_name: string;
  balance: number;
  subscription_active: boolean;
}

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
}

interface AddProductForm {
  sku_id: string;
  marketplace: string;
  name: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddProductForm>({ sku_id: '', marketplace: 'wildberries', name: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<{ name?: string; brand?: string; price?: number; rating?: number } | null>(null);
  const [validateWarning, setValidateWarning] = useState('');
  const [todayAuditCount, setTodayAuditCount] = useState<number | null>(null);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMarketplace, setImportMarketplace] = useState<'wildberries' | 'ozon'>('wildberries');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number; message: string } | null>(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }
    fetchUserData(token);
    fetchProducts(token);
    fetchTodayAuditCount(token);
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.is_verified) { router.push('/dashboard/admin'); return; }
        setUser(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (token: string) => {
    try {
      const res = await fetch('/api/v1/products/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { localStorage.removeItem('access_token'); router.push('/login'); return; }
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchTodayAuditCount = async (token: string) => {
    try {
      const res = await fetch('/api/v1/audit/history?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { localStorage.removeItem('access_token'); router.push('/login'); return; }
      if (res.ok) {
        const audits: Array<{ audit_date: string }> = await res.json();
        const todayStr = new Date().toDateString();
        setTodayAuditCount(audits.filter(a => new Date(a.audit_date).toDateString() === todayStr).length);
      }
    } catch (e) { console.error(e); }
  };

  const handleValidateSku = async () => {
    const sku = addForm.sku_id.trim();
    if (!sku) return;
    setValidating(true); setValidated(null); setValidateWarning(''); setAddError('');
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch('/api/v1/products/validate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku_id: sku, marketplace: addForm.marketplace }),
      });
      if (res.status === 401) { localStorage.removeItem('access_token'); router.push('/login'); return; }
      const data = await res.json();
      if (!data.valid) { setAddError(data.message || 'Товар не найден на маркетплейсе'); return; }
      if (data.message) setValidateWarning(data.message);
      setValidated({ name: data.name, brand: data.brand, price: data.price, rating: data.rating });
    } catch { setAddError('Ошибка при проверке артикула'); }
    finally { setValidating(false); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true); setAddError('');
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch('/api/v1/products/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.status === 401) { localStorage.removeItem('access_token'); router.push('/login'); return; }
      if (res.ok) {
        const newProduct = await res.json();
        setProducts(prev => [newProduct, ...prev]);
        setShowAddModal(false);
        setAddForm({ sku_id: '', marketplace: 'wildberries', name: '' });
        setValidated(null); setValidateWarning('');
      } else {
        const err = await res.json();
        setAddError(err.detail || 'Ошибка при добавлении товара');
      }
    } catch { setAddError('Ошибка соединения с сервером'); }
    finally { setAddLoading(false); }
  };

  const handleImport = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    setImportLoading(true);
    setImportError('');
    setImportResult(null);
    try {
      const res = await fetch('/api/v1/products/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace: importMarketplace }),
      });
      if (res.status === 401) { localStorage.removeItem('access_token'); router.push('/login'); return; }
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        // Refresh product list to show newly imported items
        fetchProducts(token);
      } else {
        setImportError(data.detail || 'Ошибка при импорте товаров');
      }
    } catch { setImportError('Ошибка соединения с сервером'); }
    finally { setImportLoading(false); }
  };

  const ratedProducts = products.filter(p => p.rating != null);
  const avgRating = ratedProducts.length > 0
    ? ratedProducts.reduce((sum, p) => sum + (p.rating as number), 0) / ratedProducts.length
    : null;
  const problematicCount = products.filter(p => p.shadow_ban_detected || p.certificate_expired || p.marking_issues).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Дашборд" activeNav="dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Привет, {user?.full_name}!</h1>
            <p className="text-purple-100 text-sm sm:text-base">Добро пожаловать в панель управления E-Com Auditor</p>
          </div>
          <div className="hidden sm:block">
            <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-right">
              <div className="text-xs text-purple-100 mb-1">Ваш баланс</div>
              <div className="text-2xl font-bold">{user?.balance?.toFixed(0)}₽</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user?.subscription_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {user?.subscription_active ? 'Pro' : 'Free'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
          <div className="text-xs text-gray-500 mt-1">Товаров</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todayAuditCount !== null ? todayAuditCount : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Проверок сегодня</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{problematicCount}</div>
          <div className="text-xs text-gray-500 mt-1">С проблемами</div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgRating != null ? `${avgRating.toFixed(1)}★` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Средний рейтинг</div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Ваши товары</h2>
            <p className="text-gray-500 text-sm hidden sm:block">Товары на мониторинге</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowImportModal(true); setImportResult(null); setImportError(''); }}
              className="border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors text-sm whitespace-nowrap flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Импорт
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              + Добавить
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Нет товаров</h3>
            <p className="text-gray-500 text-sm mb-5">Добавьте первый товар для мониторинга</p>
            <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors">
              Добавить товар
            </button>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Товар</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Площадка</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Цена</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Рейтинг</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Статус</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-sm">{product.name || '—'}</div>
                        <div className="text-xs text-gray-400">SKU: {product.sku_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${product.marketplace === 'wildberries' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {product.marketplace === 'wildberries' ? <><WildberriesIcon size={14} className="inline mr-1" />WB</> : <><OzonIcon size={14} className="inline mr-1" />Ozon</>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {product.current_price ? `${product.current_price.toFixed(0)}₽` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {product.rating ? <span className="inline-flex items-center gap-1"><StarFilledIcon size={14} className="text-amber-400" />{product.rating.toFixed(1)}</span> : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {product.shadow_ban_detected || product.certificate_expired || product.marking_issues ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><AlertIcon size={12} /> Проблемы</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckIcon size={12} /> OK</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/products/${product.id}`} className="text-purple-600 hover:text-purple-700 text-sm font-medium">Открыть →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-gray-100">
              {products.map((product) => (
                <Link key={product.id} href={`/dashboard/products/${product.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{product.name || product.sku_id}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.marketplace === 'wildberries' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {product.marketplace === 'wildberries' ? 'WB' : 'Ozon'}
                      </span>
                      {product.current_price && <span className="text-xs text-gray-500">{product.current_price.toFixed(0)}₽</span>}
                      {product.rating && <span className="inline-flex items-center gap-0.5 text-xs text-gray-500"><StarFilledIcon size={12} className="text-amber-400" />{product.rating.toFixed(1)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {product.shadow_ban_detected || product.certificate_expired || product.marking_issues
                      ? <AlertIcon size={16} className="text-red-500" />
                      : <CheckIcon size={16} className="text-green-500" />}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Добавить товар</h3>
          <p className="text-gray-500 text-xs mb-3">Добавить товар на мониторинг</p>
          <button onClick={() => setShowAddModal(true)} className="text-purple-600 hover:text-purple-700 font-semibold text-sm">Добавить →</button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Аналитика</h3>
          <p className="text-gray-500 text-xs mb-3">Детальная статистика</p>
          <Link href="/dashboard/analytics" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">Открыть →</Link>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Настройки</h3>
          <p className="text-gray-500 text-xs mb-3">API ключи и уведомления</p>
          <Link href="/dashboard/settings" className="text-green-600 hover:text-green-700 font-semibold text-sm">Настроить →</Link>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Добавить товар</h2>
              <button onClick={() => { setShowAddModal(false); setAddError(''); setValidated(null); setValidateWarning(''); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Маркетплейс <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => { setAddForm(p => ({ ...p, marketplace: 'wildberries' })); setValidated(null); setAddError(''); }}
                    className={`p-3 border-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${addForm.marketplace === 'wildberries' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <WildberriesIcon size={16} />Wildberries
                  </button>
                  <button type="button" onClick={() => { setAddForm(p => ({ ...p, marketplace: 'ozon' })); setValidated(null); setAddError(''); }}
                    className={`p-3 border-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${addForm.marketplace === 'ozon' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <OzonIcon size={16} />Ozon
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Артикул (SKU) <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addForm.sku_id}
                    onChange={e => { setAddForm(p => ({ ...p, sku_id: e.target.value })); setValidated(null); setAddError(''); }}
                    placeholder="Например: 123456789"
                    required
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
                  />
                  <button type="button" onClick={handleValidateSku} disabled={validating || !addForm.sku_id.trim()}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm disabled:opacity-50 whitespace-nowrap">
                    {validating ? '...' : 'Проверить'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Нажмите «Проверить» чтобы убедиться, что товар существует</p>
              </div>

              {validated && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-green-700 font-semibold text-sm mb-1"><CheckIcon size={15} /> Товар найден</div>
                  {validated.name && <div className="text-sm text-gray-800 font-medium">{validated.name}</div>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {validated.brand && <span>{validated.brand}</span>}
                    {validated.price && <span>{validated.price.toFixed(0)}₽</span>}
                    {validated.rating && <span className="flex items-center gap-0.5"><StarFilledIcon size={11} className="text-amber-400" />{validated.rating}</span>}
                  </div>
                </div>
              )}
              {validateWarning && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">{validateWarning}</div>}
              {addError && (
                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertIcon size={16} className="flex-shrink-0 mt-0.5" />{addError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowAddModal(false); setAddError(''); setValidated(null); setValidateWarning(''); }}
                  className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors text-sm">Отмена</button>
                <button type="submit" disabled={addLoading || !addForm.sku_id || !validated}
                  className="flex-1 px-5 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  title={!validated ? 'Сначала проверьте артикул' : ''}>
                  {addLoading ? 'Добавляем...' : 'Добавить'}
                </button>
              </div>
              {!validated && addForm.sku_id && <p className="text-center text-xs text-gray-400">Нажмите «Проверить» перед добавлением</p>}
            </form>
          </div>
        </div>
      )}

      {/* Import Products Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Импорт товаров</h2>
                <p className="text-sm text-gray-500 mt-0.5">Загрузить все товары из вашего магазина</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportResult(null); setImportError(''); }}
                className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Marketplace selector */}
            {!importResult && (
              <>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Маркетплейс</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setImportMarketplace('wildberries')}
                      className={`p-3 border-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${importMarketplace === 'wildberries' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      <WildberriesIcon size={16} />Wildberries
                    </button>
                    <button type="button" onClick={() => setImportMarketplace('ozon')}
                      className={`p-3 border-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${importMarketplace === 'ozon' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      <OzonIcon size={16} />Ozon
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs mb-5">
                  Для импорта необходим API ключ в разделе <strong>Настройки</strong>. Уже добавленные товары будут пропущены.
                </div>

                {importError && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
                    <div className="flex items-start gap-2">
                      <AlertIcon size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{importError}</span>
                    </div>
                    {(importError.includes('ключ') || importError.includes('Настройки')) && (
                      <Link href="/dashboard/settings"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-800 underline underline-offset-2 hover:text-red-900"
                        onClick={() => { setShowImportModal(false); setImportError(''); }}>
                        Перейти в Настройки →
                      </Link>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => { setShowImportModal(false); setImportError(''); }}
                    className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors text-sm">
                    Отмена
                  </button>
                  <button onClick={handleImport} disabled={importLoading}
                    className="flex-1 px-5 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2">
                    {importLoading ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Импортируем...</>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Импортировать
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Success result */}
            {importResult && (
              <div>
                <div className="flex items-center gap-3 mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckIcon size={20} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-800 text-sm">Импорт завершён</div>
                    <div className="text-xs text-green-600 mt-0.5">{importResult.message}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">{importResult.imported}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Добавлено</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-400">{importResult.skipped}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Пропущено</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Всего</div>
                  </div>
                </div>

                <button onClick={() => { setShowImportModal(false); setImportResult(null); }}
                  className="w-full px-5 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors text-sm">
                  Готово
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
