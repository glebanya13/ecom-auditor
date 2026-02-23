import Head from 'next/head';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { ArrowRightIcon, CheckIcon, SpinnerIcon, LogoIcon, EmailIcon, TelegramIcon, HandshakeIcon } from '../components/Icons';

const NAV_LINKS = [
  { href: '/features', label: 'Возможности' },
  { href: '/pricing', label: 'Тарифы' },
  { href: '/faq', label: 'FAQ' },
];

const FOOTER_COLUMNS = [
  { title: 'Продукт', links: [{ label: 'Возможности', href: '/features' }, { label: 'Тарифы', href: '/pricing' }, { label: 'API', href: '/api-docs' }] },
  { title: 'Поддержка', links: [{ label: 'Документация', href: '/docs' }, { label: 'Контакты', href: '/contact' }, { label: 'FAQ', href: '/faq' }] },
  { title: 'Компания', links: [{ label: 'О нас', href: '/about' }, { label: 'Политика', href: '/privacy' }, { label: 'Условия', href: '/terms' }] },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'general', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <>
      <Head>
        <title>Контакты — E-Com Auditor</title>
        <meta name="description" content="Свяжитесь с командой E-Com Auditor. Поддержка, партнёрство и общие вопросы." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="group flex items-center gap-3">
              <LogoIcon size={48} />
              <div>
                <div className="font-bold text-xl text-gray-900 tracking-tight">E-Com Auditor</div>
                <div className="text-xs text-gray-500 font-medium">Аудит маркетплейсов</div>
              </div>
            </Link>
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group">
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:block px-5 py-2.5 text-gray-700 hover:text-gray-900 font-semibold transition-colors">Вход</Link>
              <Link href="/register" className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/25">
                <span className="relative z-10">Начать</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Свяжитесь<br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              с нами
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Ответим на вопросы о продукте, поможем с настройкой или обсудим партнёрство
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* Contact info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Способы связи</h2>
              <div className="space-y-6">
                {[
                  {
                    Icon: EmailIcon,
                    color: 'text-blue-600',
                    bg: 'bg-blue-100',
                    title: 'Email поддержка',
                    value: 'support@ecomauditor.ru',
                    desc: 'Ответ в течение 24 часов в рабочие дни',
                  },
                  {
                    Icon: TelegramIcon,
                    color: 'text-sky-500',
                    bg: 'bg-sky-100',
                    title: 'Telegram',
                    value: '@ecomauditor',
                    desc: 'Быстрые ответы в рабочее время (9:00–18:00 МСК)',
                  },
                  {
                    Icon: HandshakeIcon,
                    color: 'text-violet-600',
                    bg: 'bg-violet-100',
                    title: 'Партнёрство',
                    value: 'partners@ecomauditor.ru',
                    desc: 'По вопросам агентского сотрудничества и Enterprise',
                  },
                ].map((contact, i) => (
                  <div key={i} className="flex items-start gap-5 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className={`w-12 h-12 ${contact.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <contact.Icon size={24} className={contact.color} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-1">{contact.title}</div>
                      <div className="text-blue-600 font-semibold mb-1">{contact.value}</div>
                      <div className="text-gray-500 text-sm">{contact.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-200 rounded-2xl">
                <h3 className="font-bold text-gray-900 mb-3">Часто задаваемые вопросы</h3>
                <p className="text-gray-600 text-sm mb-4">Возможно, ответ уже есть в нашем FAQ</p>
                <Link href="/faq" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                  Перейти в FAQ
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>

            {/* Form */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl blur-2xl opacity-10"></div>
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
                {sent ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckIcon size={40} className="text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Сообщение отправлено!</h3>
                    <p className="text-gray-600 mb-8">Мы получили ваш запрос и ответим в течение 24 часов.</p>
                    <button
                      onClick={() => { setSent(false); setForm({ name: '', email: '', subject: 'general', message: '' }); }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Отправить ещё одно
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Написать нам</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Имя</label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Иван Иванов"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none text-gray-900 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="ivan@example.com"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none text-gray-900 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Тема</label>
                        <select
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none text-gray-900 transition-all"
                        >
                          <option value="general">Общий вопрос</option>
                          <option value="support">Техническая поддержка</option>
                          <option value="billing">Вопрос об оплате</option>
                          <option value="partnership">Партнёрство</option>
                          <option value="enterprise">Enterprise запрос</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">Сообщение</label>
                        <textarea
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="Опишите ваш вопрос подробно..."
                          required
                          rows={5}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none text-gray-900 transition-all resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-3">
                            <SpinnerIcon size={20} />
                            Отправляем...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-3">
                            Отправить сообщение
                            <ArrowRightIcon size={20} className="group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <LogoIcon size={48} />
                <span className="font-bold text-xl">E-Com Auditor</span>
              </div>
              <p className="text-gray-400 leading-relaxed">Автоматический аудит товаров для маркетплейсов</p>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h4 className="font-bold mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            © 2026 E-Com Auditor. Все права защищены.
          </div>
        </div>
      </footer>
    </>
  );
}
