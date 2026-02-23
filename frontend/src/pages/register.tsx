import { useState, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogoIcon, CheckIcon, AlertIcon } from '../components/Icons';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    telegramId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Проверка совпадения паролей
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    // Проверка длины пароля
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          telegram_id: formData.telegramId || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Автоматический вход после регистрации
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.detail || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Регистрация - E-Com Auditor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <LogoIcon size={40} />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">E-Com Auditor</h1>
                  <p className="text-xs text-gray-500">Аудит товаров для селлеров</p>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <span className="text-gray-600">Уже есть аккаунт?</span>
                <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Войти
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            {/* Register Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 w-fit">
                  <LogoIcon size={64} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Создать аккаунт
                </h2>
                <p className="text-gray-600">
                  Начните проверять товары прямо сейчас
                </p>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3">
                  <CheckIcon size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-800">Успешная регистрация!</div>
                    <div className="text-green-700 text-sm mt-1">
                      Перенаправляем на страницу входа...
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                  <AlertIcon size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-800">Ошибка регистрации</div>
                    <div className="text-red-700 text-sm mt-1">{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Полное имя
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Иван Иванов"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Пароль
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Минимум 6 символов"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Подтвердите пароль
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Повторите пароль"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telegram ID <span className="text-gray-500 font-normal">(необязательно)</span>
                  </label>
                  <input
                    type="text"
                    name="telegramId"
                    value={formData.telegramId}
                    onChange={handleChange}
                    placeholder="@username или ID"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Для получения уведомлений через Telegram бота
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-4 h-4 mt-1 text-purple-600 rounded"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    Я согласен с{' '}
                    <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                      условиями использования
                    </a>{' '}
                    и{' '}
                    <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                      политикой конфиденциальности
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Создаём аккаунт...
                    </span>
                  ) : success ? (
                    <span className="flex items-center gap-1.5"><CheckIcon size={16} /> Аккаунт создан</span>
                  ) : (
                    'Создать аккаунт'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Уже есть аккаунт?{' '}
                  <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                    Войти
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
