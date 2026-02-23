import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import { WildberriesIcon, OzonIcon, PhoneIcon, CheckIcon, BugIcon, SparkleIcon, CreditCardIcon, ChatBubbleIcon } from '../../components/Icons';

const TICKET_CATEGORY_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  bug: BugIcon,
  feature: SparkleIcon,
  payment: CreditCardIcon,
  other: ChatBubbleIcon,
};

interface User {
  id: number;
  email: string;
  full_name: string | null;
  balance: number;
  subscription_active: boolean;
  telegram_id: string | null;
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center gap-1.5">
      <CheckIcon size={16} /> {message}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
      {message}
    </div>
  );
}

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // ── Password ─────────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  // ── API Keys ─────────────────────────────────────────────────────────────
  const [wbKey, setWbKey] = useState('');
  const [ozonClientId, setOzonClientId] = useState('');
  const [ozonKey, setOzonKey] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [keysSaving, setKeysSaving] = useState(false);
  const [keysSuccess, setKeysSuccess] = useState(false);
  const [keysError, setKeysError] = useState('');

  useEffect(() => {
    const tk = localStorage.getItem('access_token') || '';
    if (!tk) { router.push('/login'); return; }
    setToken(tk);
    fetch('/api/v1/auth/me', { headers: { 'Authorization': `Bearer ${tk}` } })
      .then(r => {
        if (!r.ok) { localStorage.removeItem('access_token'); router.push('/login'); return null; }
        return r.json();
      })
      .then((data: User | null) => {
        if (!data) return;
        setUser(data);
        setProfileName(data.full_name || '');
        setTelegramId(data.telegram_id || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const patch = async (payload: Record<string, unknown>): Promise<User> => {
    const res = await fetch('/api/v1/auth/me', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Ошибка при сохранении');
    }
    return res.json();
  };

  // ── Save profile name ─────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true); setProfileSuccess(false); setProfileError('');
    try {
      const updated = await patch({ full_name: profileName || null });
      setUser(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Ошибка');
    } finally { setProfileSaving(false); }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 8) { setPwError('Новый пароль должен быть не менее 8 символов'); return; }
    if (newPw !== confirmPw) { setPwError('Пароли не совпадают'); return; }
    setPwSaving(true); setPwSuccess(false);
    try {
      await patch({ current_password: currentPw, new_password: newPw });
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Ошибка');
    } finally { setPwSaving(false); }
  };

  // ── Save API keys ─────────────────────────────────────────────────────────
  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysSaving(true); setKeysSuccess(false); setKeysError('');
    const payload: Record<string, string> = {};
    if (wbKey) payload.wb_api_key = wbKey;
    if (ozonClientId) payload.ozon_client_id = ozonClientId;
    if (ozonKey) payload.ozon_api_key = ozonKey;
    if (telegramId !== (user?.telegram_id || '')) payload.telegram_id = telegramId;
    try {
      const updated = await patch(payload);
      setUser(updated);
      setWbKey(''); setOzonKey('');
      setKeysSuccess(true);
      setTimeout(() => setKeysSuccess(false), 3000);
    } catch (err: unknown) {
      setKeysError(err instanceof Error ? err.message : 'Ошибка');
    } finally { setKeysSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Настройки" activeNav="settings">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Настройки</h1>
        <p className="text-gray-500 text-sm">Профиль, безопасность и API ключи</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── Account summary ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Аккаунт</h2>
          <div className="divide-y divide-gray-100">
            {[
              { label: 'Email', value: user?.email },
              { label: 'Баланс', value: user?.balance != null ? `${user.balance.toFixed(2)} ₽` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-3">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{value ?? '—'}</span>
              </div>
            ))}
            <div className="flex justify-between py-3">
              <span className="text-sm text-gray-500">Подписка</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user?.subscription_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {user?.subscription_active ? 'Pro активна' : 'Free'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Edit profile name ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Профиль</h2>
          <p className="text-xs text-gray-400 mb-5">Отображаемое имя в личном кабинете</p>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Имя</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Иван Иванов"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
              />
            </div>
            {profileSuccess && <SuccessBanner message="Имя обновлено" />}
            {profileError && <ErrorBanner message={profileError} />}
            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
            >
              {profileSaving ? 'Сохраняем...' : 'Сохранить имя'}
            </button>
          </form>
        </div>

        {/* ── Change password ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Смена пароля</h2>
          <p className="text-xs text-gray-400 mb-5">Укажите текущий пароль для подтверждения</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Текущий пароль</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Новый пароль</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Минимум 8 символов"
                autoComplete="new-password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Подтвердите новый пароль</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Повторите пароль"
                autoComplete="new-password"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-gray-900 transition-colors text-sm ${
                  confirmPw && newPw !== confirmPw
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-purple-500'
                }`}
              />
              {confirmPw && newPw !== confirmPw && (
                <p className="text-xs text-red-500 mt-1">Пароли не совпадают</p>
              )}
            </div>
            {pwSuccess && <SuccessBanner message="Пароль успешно изменён" />}
            {pwError && <ErrorBanner message={pwError} />}
            <button
              type="submit"
              disabled={pwSaving || !currentPw || !newPw || !confirmPw}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {pwSaving ? 'Меняем пароль...' : 'Изменить пароль'}
            </button>
          </form>
        </div>

        {/* ── API Keys ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">API ключи маркетплейсов</h2>
          <p className="text-xs text-gray-400 mb-5">Ключи шифруются и хранятся безопасно.</p>

          <form onSubmit={handleSaveKeys} className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5"><WildberriesIcon size={16} className="text-purple-600" /> Wildberries API ключ</label>
              <input
                type="password"
                value={wbKey}
                onChange={e => setWbKey(e.target.value)}
                placeholder="Оставьте пустым, чтобы не менять"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">WB → Настройки → Доступ к API</p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5"><OzonIcon size={16} className="text-blue-600" /> Ozon Client ID</label>
              <input
                type="text"
                value={ozonClientId}
                onChange={e => setOzonClientId(e.target.value)}
                placeholder="Например: 123456"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5"><OzonIcon size={16} className="text-blue-600" /> Ozon API ключ</label>
              <input
                type="password"
                value={ozonKey}
                onChange={e => setOzonKey(e.target.value)}
                placeholder="Оставьте пустым, чтобы не менять"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Ozon Seller → Настройки → API ключи</p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5"><PhoneIcon size={16} className="text-gray-600" /> Telegram ID (уведомления)</label>
              <input
                type="text"
                value={telegramId}
                onChange={e => setTelegramId(e.target.value)}
                placeholder="Например: 123456789"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Узнать ID: бот @userinfobot в Telegram</p>
            </div>

            {keysSuccess && <SuccessBanner message="Настройки успешно сохранены" />}
            {keysError && <ErrorBanner message={keysError} />}

            <button
              type="submit"
              disabled={keysSaving}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {keysSaving ? 'Сохраняем...' : 'Сохранить ключи'}
            </button>
          </form>
        </div>

        {/* ── Support ticket ─────────────────────────────────────────────── */}
        <SupportTicket token={token} userEmail={user?.email} />

      </div>
    </DashboardLayout>
  );
}

// ── Support Ticket form ───────────────────────────────────────────────────────

function SupportTicket({ token, userEmail }: { token: string; userEmail?: string }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('bug');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) { setError('Заполните тему и описание'); return; }
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await fetch('/api/v1/admin/tickets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), category, contact_email: userEmail }),
      });
      if (!res.ok) { const e = await res.json(); setError(e.detail || 'Ошибка'); return; }
      setSuccess(true);
      setSubject(''); setDescription(''); setCategory('bug');
      setTimeout(() => setSuccess(false), 5000);
    } catch { setError('Ошибка соединения'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Сообщить о проблеме</h2>
      <p className="text-xs text-gray-400 mb-5">Опишите баг или предложение — мы ответим как можно скорее</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
            {(() => { const Icon = TICKET_CATEGORY_ICONS[category] || BugIcon; return <Icon size={18} className="text-gray-500" />; })()}
            Категория
          </label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 text-sm">
            <option value="bug">Баг / ошибка</option>
            <option value="feature">Предложение</option>
            <option value="payment">Вопрос по оплате</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Тема</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Кратко опишите проблему"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Описание</label>
          <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробно опишите проблему: что делали, что ожидали, что произошло..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors text-sm resize-none" />
        </div>
        {success && <SuccessBanner message="Заявка отправлена! Мы рассмотрим её и ответим вам." />}
        {error && <ErrorBanner message={error} />}
        <button type="submit" disabled={saving || !subject || !description}
          className="w-full py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
          {saving ? 'Отправляем...' : 'Отправить заявку'}
        </button>
      </form>
    </div>
  );
}
