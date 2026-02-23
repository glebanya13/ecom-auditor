import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { BugIcon, SparkleIcon, CreditCardIcon, ChatBubbleIcon, InboxEmptyIcon } from '../../../components/Icons';

interface Ticket {
  id: number;
  user_id: number | null;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  admin_response: string | null;
  contact_email: string | null;
  contact_name: string | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
  user_email: string | null;
  user_name: string | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open:        { label: 'Открыта',  cls: 'bg-red-100 text-red-700 border-red-200' },
  in_progress: { label: 'В работе', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  resolved:    { label: 'Решена',   cls: 'bg-green-100 text-green-700 border-green-200' },
  closed:      { label: 'Закрыта', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const PRIORITY_LABELS: Record<string, { label: string; cls: string }> = {
  low:      { label: 'Низкий',    cls: 'text-gray-500' },
  medium:   { label: 'Средний',   cls: 'text-blue-600' },
  high:     { label: 'Высокий',   cls: 'text-orange-600' },
  critical: { label: 'Критичный', cls: 'text-red-600 font-bold' },
};

const CATEGORY_CONFIG: Record<string, { label: string; Icon: React.FC<{ size?: number; className?: string }> }> = {
  bug:     { label: 'Баг',     Icon: BugIcon },
  feature: { label: 'Функция', Icon: SparkleIcon },
  payment: { label: 'Оплата',  Icon: CreditCardIcon },
  other:   { label: 'Другое',  Icon: ChatBubbleIcon },
};

function CategoryLabel({ category, size = 14 }: { category: string; size?: number }) {
  const config = CATEGORY_CONFIG[category] || { label: category, Icon: ChatBubbleIcon };
  const Icon = config.Icon;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon size={size} className="shrink-0 text-gray-500" />
      <span>{config.label}</span>
    </span>
  );
}

function fmt(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminTickets() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Detail modal
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchTickets = useCallback(async (tk: string, st = '', pr = '') => {
    let url = '/api/v1/admin/tickets?limit=100';
    if (st) url += `&status=${st}`;
    if (pr) url += `&priority=${pr}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${tk}` } });
    if (!r.ok) return;
    const data = await r.json();
    setTickets(data.items);
    setTotal(data.total);
  }, []);

  useEffect(() => {
    const tk = localStorage.getItem('access_token') || '';
    if (!tk) { router.push('/login'); return; }
    setToken(tk);
    fetchTickets(tk, statusFilter, priorityFilter).finally(() => setLoading(false));
  }, [router, statusFilter, priorityFilter, fetchTickets]);

  function openTicket(t: Ticket) {
    setSelected(t);
    setResponse(t.admin_response || '');
    setNewStatus(t.status);
    setNewPriority(t.priority);
    setSaveError('');
  }

  async function saveTicket() {
    if (!selected) return;
    setSaving(true); setSaveError('');
    try {
      const r = await fetch(`/api/v1/admin/tickets/${selected.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, priority: newPriority, admin_response: response || null }),
      });
      if (!r.ok) { const e = await r.json(); setSaveError(e.detail || 'Ошибка'); return; }
      const updated: Ticket = await r.json();
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelected(updated);
    } catch { setSaveError('Ошибка соединения'); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
    </div>
  );

  return (
    <AdminLayout title="Заявки" activeNav="tickets">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Заявки</h1>
          <p className="text-gray-500 text-sm">{total} заявок, показано: {tickets.length}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:border-purple-500 focus:outline-none"
          >
            <option value="">Все статусы</option>
            <option value="open">Открытые</option>
            <option value="in_progress">В работе</option>
            <option value="resolved">Решённые</option>
            <option value="closed">Закрытые</option>
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:border-purple-500 focus:outline-none"
          >
            <option value="">Все приоритеты</option>
            <option value="critical">Критичный</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {tickets.map(t => {
          const st = STATUS_LABELS[t.status] || STATUS_LABELS.open;
          const pr = PRIORITY_LABELS[t.priority] || PRIORITY_LABELS.medium;
          return (
            <div
              key={t.id}
              onClick={() => openTicket(t)}
              className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}>{st.label}</span>
                    <span className={`text-xs font-semibold ${pr.cls}`}>{pr.label}</span>
                    <span className="text-xs text-gray-500"><CategoryLabel category={t.category} size={14} /></span>
                    <span className="text-xs text-gray-400">#{t.id}</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{t.subject}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</div>
                </div>
                <div className="text-right text-xs text-gray-400 shrink-0">
                  <div>{t.user_email || t.contact_email || '—'}</div>
                  <div className="mt-0.5">{fmt(t.created_at)}</div>
                </div>
              </div>
              {t.admin_response && (
                <div className="mt-3 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-700 line-clamp-1">
                  ↳ {t.admin_response}
                </div>
              )}
            </div>
          );
        })}
        {!tickets.length && (
          <div className="py-20 text-center text-gray-400">
            <InboxEmptyIcon size={48} className="mx-auto mb-3 text-gray-300" />
            <div>Заявок нет</div>
          </div>
        )}
      </div>

      {/* Ticket detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-gray-400">#{selected.id}</span>
                  <span className="text-xs text-gray-500"><CategoryLabel category={selected.category} size={14} /></span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{selected.subject}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  {selected.user_email || selected.contact_email} · {fmt(selected.created_at)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-gray-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Description */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Описание</div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selected.description}</div>
              </div>

              {/* Controls */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Статус</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-purple-500 focus:outline-none">
                    <option value="open">Открыта</option>
                    <option value="in_progress">В работе</option>
                    <option value="resolved">Решена</option>
                    <option value="closed">Закрыта</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Приоритет</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-purple-500 focus:outline-none">
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="critical">Критичный</option>
                  </select>
                </div>
              </div>

              {/* Admin response */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ответ администратора</label>
                <textarea
                  rows={4}
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Введите ответ на заявку..."
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Meta */}
              {(selected.resolved_at || selected.user_name || selected.contact_email) && (
                <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 space-y-1">
                  {selected.user_name && <div>Пользователь: <span className="text-gray-700">{selected.user_name}</span></div>}
                  {selected.contact_email && <div>Контакт: <span className="text-gray-700">{selected.contact_email}</span></div>}
                  {selected.resolved_at && <div>Решена: <span className="text-gray-700">{fmt(selected.resolved_at)}</span></div>}
                </div>
              )}

              {saveError && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{saveError}</div>}
            </div>

            <div className="p-5 pt-0 flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">Закрыть</button>
              <button onClick={saveTicket} disabled={saving} className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
