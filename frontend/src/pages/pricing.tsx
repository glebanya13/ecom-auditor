import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { CheckIcon, ArrowRightIcon, ZapIcon, AlertIcon, LogoIcon, CloseIcon } from '../components/Icons';

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

const PLANS = [
  {
    name: 'Freemium',
    price: { monthly: '0₽', yearly: '0₽' },
    period: 'навсегда',
    description: 'Для знакомства с сервисом',
    features: [
      '3 проверки в день',
      'Базовый скоринг',
      'Список проблем',
      'WB и Ozon',
    ],
    missing: ['PDF отчёты', 'Telegram бот', 'Мониторинг', 'API доступ'],
    cta: 'Начать бесплатно',
    popular: false,
    color: 'border-gray-200',
  },
  {
    name: 'Pro',
    price: { monthly: '2 500₽', yearly: '1 900₽' },
    period: 'в месяц',
    description: 'Для профессиональных селлеров',
    features: [
      'Безлимитные проверки',
      'Полный аудит + рекомендации',
      'PDF отчёты',
      'Telegram бот',
      'Мониторинг 10 товаров',
      'История проверок 90 дней',
    ],
    missing: ['API доступ', 'Приоритетная поддержка'],
    cta: 'Выбрать Pro',
    popular: true,
    color: 'border-blue-600',
  },
  {
    name: 'Enterprise',
    price: { monthly: '15 000₽', yearly: '12 000₽' },
    period: 'в месяц',
    description: 'Для компаний и агентств',
    features: [
      'Всё из Pro',
      'Мониторинг 100 товаров',
      'API доступ',
      'Приоритетная поддержка',
      'Индивидуальные настройки',
      'Выделенный менеджер',
    ],
    missing: [],
    cta: 'Связаться с нами',
    popular: false,
    color: 'border-gray-200',
  },
];

const FAQ = [
  { q: 'Можно ли отменить подписку?', a: 'Да, вы можете отменить подписку в любой момент. После отмены тариф остаётся активным до конца оплаченного периода.' },
  { q: 'Какие способы оплаты принимаются?', a: 'Принимаем банковские карты (Visa, Mastercard, МИР), СБП и выставляем счета для юридических лиц.' },
  { q: 'Есть ли пробный период для Pro?', a: 'Да, первые 7 дней Pro тарифа бесплатны. Карта не требуется для активации пробного периода.' },
  { q: 'Как происходит переход с Freemium на Pro?', a: 'Достаточно нажать "Выбрать Pro" в личном кабинете и выбрать способ оплаты. Доступ открывается мгновенно.' },
  { q: 'Есть ли скидки для агентств?', a: 'Для агентств и партнёров с объёмом более 500 SKU — свяжитесь с нами для обсуждения индивидуальных условий.' },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Head>
        <title>Тарифы — E-Com Auditor</title>
        <meta name="description" content="Выберите подходящий тариф E-Com Auditor. Freemium, Pro и Enterprise планы для селлеров маркетплейсов." />
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
      <section className="pt-32 pb-12 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-8">
            <ZapIcon size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Прозрачное ценообразование</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Выберите<br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              подходящий тариф
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto">Начните бесплатно, перейдите на Pro когда будете готовы</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-100 rounded-2xl p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${!yearly ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Ежемесячно
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${yearly ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Ежегодно
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">−24%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-24 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-8 ${
                plan.popular
                  ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-violet-50 shadow-2xl scale-105'
                  : plan.color + ' bg-white'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold rounded-full">
                    Популярный
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-bold text-gray-900">{yearly ? plan.price.yearly : plan.price.monthly}</span>
                  </div>
                  <div className="text-gray-600 text-sm">{plan.period}{yearly && plan.name !== 'Freemium' ? ', оплата раз в год' : ''}</div>
                  <p className="text-sm text-gray-500 mt-3">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckIcon size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.missing.length > 0 && (
                  <ul className="space-y-3 mb-8">
                    {plan.missing.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 opacity-40">
                        <CloseIcon size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-8">
                  <Link
                    href="/register"
                    className={`block w-full text-center px-6 py-4 font-bold rounded-xl transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-xl hover:shadow-blue-500/25'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Notice */}
          <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
            <AlertIcon size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 mb-1">Изменения НДС с 2026 года</p>
              <p className="text-amber-800 text-sm">Все финансовые расчёты уже учитывают новую ставку НДС 22%, введённую с 1 января 2026 года. Проверьте рентабельность ваших товаров с актуальными данными.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Вопросы об оплате</h2>
            <p className="text-xl text-gray-600">Ответы на частые вопросы о тарифах и подписке</p>
          </div>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{item.q}</span>
                  <span className={`text-blue-600 text-xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Начните бесплатно прямо сейчас</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">Регистрация занимает 30 секунд. Карта не нужна.</p>
          <Link href="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transition-all text-lg">
            Создать аккаунт
            <ArrowRightIcon size={22} />
          </Link>
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
