import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/DashboardLayout';
import { WildberriesIcon, OzonIcon, StarFilledIcon, AlertIcon, CheckIcon, SpinnerIcon } from '../../../components/Icons';

interface Product {
  id: number;
  sku_id: string;
  marketplace: string;
  name: string;
  current_price: number | null;
  rating: number | null;
  shadow_ban_detected: boolean;
  certificate_expired: boolean;
}

interface AddProductForm {
  sku_id: string;
  marketplace: string;
  name: string;
}

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddProductForm>({ sku_id: '', marketplace: 'wildberries', name: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<{ name?: string; brand?: string; price?: number; rating?: number } | null>(null);
  const [validateWarning, setValidateWarning] = useState('');
  const [search, setSearch] = useState('');
  const [filterMarketplace, setFilterMarketplace] = useState<'all' | 'wildberries' | 'ozon'>('all');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/login'); return; }
    fetchProducts(token);
  }, []);

  const fetchProducts = async (token: string) => {
    try {
      const res = await fetch('/api/v1/products/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateSku = async () => {
    const sku = addForm.sku_id.trim();
    if (!sku) return;
    setValidating(true);
    setValidated(null);
    setValidateWarning('');
    setAddError('');
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch('/api/v1/products/validate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku_id: sku, marketplace: addForm.marketplace }),
      });
      const data = await res.json();
      if (!data.valid) {
        setAddError(data.message || 'Товар не найден на маркетплейсе');
        return;
      }
      if (data.message) setValidateWarning(data.message);
      setValidated({ name: data.name, brand: data.brand, price: data.price, rating: data.rating });
    } catch {
      setAddError('Ошибка при проверке артикула');
    } finally {
      setValidating(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await fetch('/api/v1/products/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const newProduct = await res.json();
        setProducts(prev => [newProduct, ...prev]);
        setShowAddModal(false);
        setAddForm({ sku_id: '', marketplace: 'wildberries', name: '' });
        setValidated(null);
        setValidateWarning('');
      } else {
        const err = await res.json();
        setAddError(err.detail || 'Ошибка при добавлении товара');
      }
    } catch {
      setAddError('Ошибка соединения с сервером');
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || (p.name || p.sku_id).toLowerCase().includes(search.toLowerCase());
    const matchMarket = filterMarketplace === 'all' || p.marketplace === filterMarketplace;
    return matchSearch && matchMarket;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Товары" activeNav="products">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} товаров на мониторинге</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm"
        >
          + Добавить товар
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Поиск по названию или SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm text-gray-900"
        />
        <div className="flex gap-2">
          {(['all', 'wildberries', 'ozon'] as const).map(m => (
            <button
              key={m}
              onClick={() => setFilterMarketplace(m)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                filterMarketplace === m
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {m === 'all' ? 'Все' : m === 'wildberries' ? 'WB' : 'Ozon'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {products.length === 0 ? 'Нет товаров' : 'Ничего не найдено'}
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              {products.length === 0 ? 'Добавьте первый товар для мониторинга' : 'Попробуйте изменить фильтры'}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Добавить товар
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Товар</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Площадка</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Цена</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Рейтинг</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-sm">{product.name || '—'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">SKU: {product.sku_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.marketplace === 'wildberries' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {product.marketplace === 'wildberries'
                            ? <><WildberriesIcon size={13} />WB</>
                            : <><OzonIcon size={13} />Ozon</>
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {product.current_price ? `${product.current_price.toFixed(0)}₽` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {product.rating
                          ? <span className="inline-flex items-center gap-1"><StarFilledIcon size={14} className="text-amber-400" />{product.rating.toFixed(1)}</span>
                          : <span className="text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        {product.shadow_ban_detected || product.certificate_expired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <AlertIcon size={12} /> Проблемы
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <CheckIcon size={12} /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/products/${product.id}`} className="text-purple-600 hover:text-purple-700 text-sm font-semibold">
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
              {filtered.map((product) => (
                <Link key={product.id} href={`/dashboard/products/${product.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{product.name || product.sku_id}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.marketplace === 'wildberries' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {product.marketplace === 'wildberries' ? 'WB' : 'Ozon'}
                      </span>
                      {product.current_price && <span className="text-xs text-gray-500">{product.current_price.toFixed(0)}₽</span>}
                      {product.rating && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
                          <StarFilledIcon size={12} className="text-amber-400" />{product.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {product.shadow_ban_detected || product.certificate_expired
                      ? <AlertIcon size={16} className="text-red-500" />
                      : <CheckIcon size={16} className="text-green-500" />
                    }
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
              {/* Marketplace */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Маркетплейс <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => { setAddForm(prev => ({ ...prev, marketplace: 'wildberries' })); setValidated(null); setAddError(''); }}
                    className={`p-3 border-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${addForm.marketplace === 'wildberries' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <WildberriesIcon size={16} />Wildberries
                  </button>
                  <button type="button" onClick={() => { setAddForm(prev => ({ ...prev, marketplace: 'ozon' })); setValidated(null); setAddError(''); }}
                    className={`p-3 border-2 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${addForm.marketplace === 'ozon' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <OzonIcon size={16} />Ozon
                  </button>
                </div>
              </div>

              {/* SKU + validate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Артикул (SKU) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addForm.sku_id}
                    onChange={e => { setAddForm(prev => ({ ...prev, sku_id: e.target.value })); setValidated(null); setAddError(''); }}
                    placeholder="Например: 123456789"
                    required
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleValidateSku}
                    disabled={validating || !addForm.sku_id.trim()}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                  >
                    {validating ? <><SpinnerIcon size={14} /> Проверяем</> : 'Проверить'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Нажмите «Проверить» чтобы убедиться, что товар существует</p>
              </div>

              {/* Validation result */}
              {validated && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-green-700 font-semibold text-sm mb-1">
                    <CheckIcon size={15} /> Товар найден
                  </div>
                  {validated.name && <div className="text-sm text-gray-800 font-medium">{validated.name}</div>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {validated.brand && <span>{validated.brand}</span>}
                    {validated.price && <span>{validated.price.toFixed(0)}₽</span>}
                    {validated.rating && <span className="flex items-center gap-0.5"><StarFilledIcon size={11} className="text-amber-400" />{validated.rating}</span>}
                  </div>
                </div>
              )}
              {validateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">{validateWarning}</div>
              )}

              {addError && (
                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertIcon size={16} className="flex-shrink-0 mt-0.5" />
                  {addError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowAddModal(false); setAddError(''); setValidated(null); setValidateWarning(''); }}
                  className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors text-sm">
                  Отмена
                </button>
                <button type="submit" disabled={addLoading || !addForm.sku_id || !validated}
                  className="flex-1 px-5 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  title={!validated ? 'Сначала проверьте артикул' : ''}>
                  {addLoading ? 'Добавляем...' : 'Добавить'}
                </button>
              </div>
              {!validated && addForm.sku_id && (
                <p className="text-center text-xs text-gray-400">Нажмите «Проверить» перед добавлением</p>
              )}
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
