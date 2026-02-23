import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';

interface UserRow {
  id: number;
  email: string;
  full_name: string | null;
  balance: number;
  subscription_active: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
  telegram_id: string | null;
  ozon_client_id: string | null;
}

interface EditForm {
  full_name: string;
  email: string;
  password: string;
  subscription_active: boolean;
  is_active: boolean;
  is_verified: boolean;
  telegram_id: string;
}

function fmt(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminUsers() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [topupUser, setTopupUser] = useState<UserRow | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupSaving, setTopupSaving] = useState(false);
  const [topupError, setTopupError] = useState('');

  const fetchUsers = useCallback(async (tk: string) => {
    const r = await fetch('/api/v1/admin/users?limit=500', { headers: { Authorization: `Bearer ${tk}` } });
    if (!r.ok) return;
    setUsers(await r.json());
  }, []);

  useEffect(() => {
    const tk = localStorage.getItem('access_token') || '';
    if (!tk) { router.push('/login'); return; }
    setToken(tk);
    fetchUsers(tk).finally(() => setLoading(false));
  }, [router, fetchUsers]);

  function openEdit(u: UserRow) {
    setEditUser(u);
    setEditForm({ full_name: u.full_name || '', email: u.email, password: '', subscription_active: u.subscription_active, is_active: u.is_active, is_verified: u.is_verified, telegram_id: u.telegram_id || '' });
    setEditError('');
  }

  async function saveEdit() {
    if (!editUser || !editForm) return;
    setEditSaving(true); setEditError('');
    const payload: Record<string, unknown> = { full_name: editForm.full_name || null, email: editForm.email, subscription_active: editForm.subscription_active, is_active: editForm.is_active, is_verified: editForm.is_verified, telegram_id: editForm.telegram_id || null };
    if (editForm.password) payload.password = editForm.password;
    try {
      const r = await fetch(`/api/v1/admin/users/${editUser.id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) { const e = await r.json(); setEditError(e.detail || 'Ошибка'); return; }
      const updated: UserRow = await r.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditUser(null);
    } catch { setEditError('Ошибка соединения'); }
    finally { setEditSaving(false); }
  }

  function openTopup(u: UserRow) { setTopupUser(u); setTopupAmount(''); setTopupError(''); }

  async function saveTopup() {
    if (!topupUser) return;
    const amount = parseFloat(topupAmount.replace(',', '.'));
    if (isNaN(amount) || amount === 0) { setTopupError('Введите сумму'); return; }
    setTopupSaving(true); setTopupError('');
    try {
      const r = await fetch('/api/v1/admin/balance/topup', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: topupUser.id, amount }) });
      if (!r.ok) { const e = await r.json(); setTopupError(e.detail || 'Ошибка'); return; }
      const updated: UserRow = await r.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setTopupUser(null);
    } catch { setTopupError('Ошибка соединения'); }
    finally { setTopupSaving(false); }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q) || String(u.id).includes(q);
  });

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
    </div>
  );

  return (
    <AdminLayout title="Пользователи" activeNav="users">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Пользователи</h1>
          <p className="text-gray-500 text-sm">{users.length} аккаунтов в системе</p>
        </div>
        <input
          type="text"
          placeholder="Поиск по email, имени, ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['ID', 'Email / Имя', 'Баланс', 'Подписка', 'Статус', 'Последний вход', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{u.email}</div>
                  {u.full_name && <div className="text-xs text-gray-500">{u.full_name}</div>}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{u.balance.toFixed(0)} ₽</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.subscription_active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.subscription_active ? 'Pro' : 'Free'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Активен' : 'Заблок.'}
                    </span>
                    {u.is_verified && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Admin</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{fmt(u.last_login)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Изменить</button>
                    <button onClick={() => openTopup(u)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">Баланс</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Пользователи не найдены</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{u.email}</div>
                {u.full_name && <div className="text-xs text-gray-500 mt-0.5">{u.full_name}</div>}
                <div className="text-xs text-gray-400 mt-0.5">ID: {u.id}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.subscription_active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.subscription_active ? 'Pro' : 'Free'}</span>
                {u.is_verified && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Admin</span>}
              </div>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-500 text-xs">Баланс</span>
              <span className="font-bold text-gray-900">{u.balance.toFixed(0)} ₽</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(u)} className="flex-1 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">Изменить</button>
              <button onClick={() => openTopup(u)} className="flex-1 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100">Баланс</button>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="text-center py-12 text-gray-400">Пользователи не найдены</div>}
      </div>

      {/* Edit Modal */}
      {editUser && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Редактировать</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editUser.email} · ID {editUser.id}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Имя', key: 'full_name' as const, type: 'text', placeholder: 'Иван Иванов' },
                { label: 'Email', key: 'email' as const, type: 'email', placeholder: 'email@example.com' },
                { label: 'Новый пароль', key: 'password' as const, type: 'password', placeholder: 'Оставьте пустым' },
                { label: 'Telegram ID', key: 'telegram_id' as const, type: 'text', placeholder: '123456789' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <input type={type} value={editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })} placeholder={placeholder}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none" />
                </div>
              ))}
              <div className="space-y-3 pt-1">
                {([
                  { key: 'subscription_active' as const, label: 'Pro подписка' },
                  { key: 'is_active' as const, label: 'Аккаунт активен' },
                  { key: 'is_verified' as const, label: 'Администратор' },
                ]).map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">{label}</span>
                    <div className="relative" onClick={() => setEditForm({ ...editForm, [key]: !editForm[key] })}>
                      <div className={`w-11 h-6 rounded-full transition-colors ${editForm[key] ? 'bg-purple-600' : 'bg-gray-200'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm[key] ? 'translate-x-5' : ''}`} />
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {editError && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{editError}</div>}
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">Отмена</button>
              <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                {editSaving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topup Modal */}
      {topupUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Изменить баланс</h2>
                <p className="text-xs text-gray-400 mt-0.5">{topupUser.email}</p>
              </div>
              <button onClick={() => setTopupUser(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between text-sm">
                <span className="text-gray-500">Текущий баланс</span>
                <span className="font-bold text-gray-900">{topupUser.balance.toFixed(2)} ₽</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Сумма <span className="text-gray-400 font-normal">(отрицательная — списание)</span></label>
                <div className="relative">
                  <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)} placeholder="500" step="any"
                    className="w-full px-3 py-2.5 pr-8 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₽</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 5000].map(a => (
                    <button key={a} onClick={() => setTopupAmount(String(a))}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors">
                      +{a}
                    </button>
                  ))}
                </div>
              </div>
              {topupAmount && !isNaN(parseFloat(topupAmount)) && (
                <div className="px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl flex justify-between text-sm">
                  <span className="text-gray-500">Станет</span>
                  <span className="font-bold text-purple-700">{(topupUser.balance + parseFloat(topupAmount)).toFixed(2)} ₽</span>
                </div>
              )}
              {topupError && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{topupError}</div>}
            </div>
            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setTopupUser(null)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">Отмена</button>
              <button onClick={saveTopup} disabled={topupSaving || !topupAmount} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                {topupSaving ? 'Применяем...' : 'Применить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
