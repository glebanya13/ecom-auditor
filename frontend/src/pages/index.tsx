import { useState, useEffect, useRef, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  SearchIcon, ShieldIcon, ChartIcon, WalletIcon,
  PackageIcon, CheckIcon, ArrowRightIcon, TrendingIcon,
  AlertIcon, ZapIcon, LockIcon, SpinnerIcon, LogoIcon
} from '../components/Icons';

// ── Quick-check constants ────────────────────────────────────────────────────
const QC_DURATION_MS = 10000;

const QC_STAGES = [
  'Подключаемся к базам данных маркетплейса...',
  'Проверяем маркировку и сертификаты...',
  'Анализируем видимость товара в поиске...',
  'Проверяем ценовую политику и демпинг...',
  'Выявляем нарушения и юридические риски...',
  'Формируем сводку критических проблем...',
];

// Blurred "findings" — visually convincing, intentionally unreadable
const QC_BLURRED_ISSUES = [
  'Нарушение требований маркировки «Честный ЗНАК» — товар не зарегистрирован в ГИС МТ',
  'Сертификат соответствия №РОСС RU.АЛ01.Н01234 — истёк срок действия 14.11.2024',
  'Теневая блокировка в поисковой выдаче — снижение позиций на 87% за 30 дней',
  'Нарушение ценового диапазона площадки — демпинг зафиксирован в 3 категориях',
  'Отсутствует декларация соответствия ТР ТС 004/2011 для данной группы товаров',
];

type QcStep = 'idle' | 'loading' | 'result';
// ────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [skuId, setSkuId] = useState('');
  const [marketplace, setMarketplace] = useState('');

  // Quick-check state machine
  const [qcStep, setQcStep] = useState<QcStep>('idle');
  const [qcProgress, setQcProgress] = useState(0);
  const [qcStageIdx, setQcStageIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!marketplace || qcStep === 'loading') return;

    // Start fake 10-second scan — NO real API request
    setQcStep('loading');
    setQcProgress(0);
    setQcStageIdx(0);

    const startedAt = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min((elapsed / QC_DURATION_MS) * 100, 100);
      setQcProgress(pct);
      setQcStageIdx(Math.min(
        Math.floor((pct / 100) * QC_STAGES.length),
        QC_STAGES.length - 1,
      ));

      if (elapsed >= QC_DURATION_MS) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setQcProgress(100);
        setQcStep('result');
        // Scroll result into view
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
      }
    }, 80);
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQcStep('idle');
    setQcProgress(0);
    setQcStageIdx(0);
  };

  return (
    <>
      <Head>
        <title>E-Com Auditor — Автоматический аудит товаров на маркетплейсах</title>
        <meta name="description" content="Проверяйте товары на соответствие законам, анализируйте финансы и предотвращайте риски" />
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
              <Link href="/#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group">
                Возможности
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group">
                Тарифы
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/#faq" className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative group">
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:block px-5 py-2.5 text-gray-700 hover:text-gray-900 font-semibold transition-colors">
                Вход
              </Link>
              <Link href="/register" className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/25">
                <span className="relative z-10">Начать</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-8">
                <ZapIcon size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Новая версия 2026</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                Автоматический<br />
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  аудит товаров
                </span><br />
                на маркетплейсах
              </h1>

              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                Проверяйте соответствие ФЗ-289, анализируйте финансы с НДС 22%,
                предотвращайте шадоубан и управляйте рисками
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  'Проверка за 30 сек',
                  'Без регистрации',
                  'WB и Ozon',
                  '100% точность',
                ].map((label) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckIcon size={18} className="text-emerald-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <a href="#audit-form" className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl inline-flex items-center gap-3 hover:shadow-xl hover:shadow-blue-500/25 transition-all">
                  Проверить товар
                  <ArrowRightIcon size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <Link href="/#features" className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-xl hover:border-gray-300 transition-colors">
                  Подробнее
                </Link>
              </div>
            </div>

            {/* Right — Quick-check form */}
            <div id="audit-form" className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-8">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                    <SearchIcon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Быстрая проверка</h3>
                    <p className="text-sm text-gray-500">Получите результат за 30 секунд</p>
                  </div>
                </div>

                {/* Form — always visible so user can re-run */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Артикул товара (SKU)
                    </label>
                    <input
                      type="text"
                      value={skuId}
                      onChange={(e) => setSkuId(e.target.value)}
                      placeholder="Например: 123456789"
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none text-gray-900 transition-all"
                      required
                      disabled={qcStep === 'loading'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Маркетплейс
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setMarketplace('wildberries')}
                        disabled={qcStep === 'loading'}
                        className={`group relative p-5 border-2 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          marketplace === 'wildberries'
                            ? 'border-violet-600 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-10 h-10 mx-auto mb-2 bg-violet-100 rounded-lg flex items-center justify-center">
                          <PackageIcon size={20} className={marketplace === 'wildberries' ? 'text-violet-600' : 'text-gray-600'} />
                        </div>
                        <div className={marketplace === 'wildberries' ? 'text-violet-700' : 'text-gray-700'}>Wildberries</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMarketplace('ozon')}
                        disabled={qcStep === 'loading'}
                        className={`group relative p-5 border-2 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                          marketplace === 'ozon'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                          <PackageIcon size={20} className={marketplace === 'ozon' ? 'text-blue-600' : 'text-gray-600'} />
                        </div>
                        <div className={marketplace === 'ozon' ? 'text-blue-700' : 'text-gray-700'}>Ozon</div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={qcStep === 'loading' || !marketplace || !skuId.trim()}
                    className="w-full group relative px-6 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {qcStep === 'loading' ? (
                      <span className="flex items-center justify-center gap-3">
                        <SpinnerIcon size={20} />
                        Проверяем товар...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        <SearchIcon size={20} />
                        Проверить товар
                        <ArrowRightIcon size={20} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </button>
                </form>

                {/* ── LOADING state ────────────────────────────────────── */}
                {qcStep === 'loading' && (
                  <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
                    {/* Progress bar */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span className="font-medium">{QC_STAGES[qcStageIdx]}</span>
                      <span>{Math.round(qcProgress)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-100"
                        style={{ width: `${qcProgress}%` }}
                      />
                    </div>

                    {/* Stage checklist */}
                    <div className="space-y-2">
                      {QC_STAGES.map((stage, i) => {
                        const done = i < qcStageIdx;
                        const active = i === qcStageIdx;
                        return (
                          <div key={i} className={`flex items-center gap-2.5 text-sm transition-opacity duration-300 ${done || active ? 'opacity-100' : 'opacity-30'}`}>
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-emerald-100' : active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              {done ? (
                                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : active ? (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              ) : (
                                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                              )}
                            </div>
                            <span className={done ? 'text-gray-500' : active ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── RESULT — always RED ───────────────────────────────── */}
                {qcStep === 'result' && (
                  <div ref={resultRef} className="mt-8">
                    {/* Red status header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Score badge — always critical */}
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex flex-col items-center justify-center shadow-lg shadow-rose-200 flex-shrink-0">
                          <span className="text-2xl font-black text-white leading-none">23</span>
                          <span className="text-white/80 text-[10px] font-semibold leading-none mt-0.5">/ 100</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-rose-600 mb-0.5">Критические риски</div>
                          <div className="text-xs text-gray-500 leading-tight max-w-[200px]">
                            Обнаружены серьёзные нарушения, требующие немедленного внимания
                          </div>
                        </div>
                      </div>
                      <button onClick={handleReset} className="text-gray-300 hover:text-gray-500 transition-colors p-1 flex-shrink-0" title="Новая проверка">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Blurred issues list */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-bold text-gray-900 text-sm">Обнаруженные проблемы:</h4>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                          {QC_BLURRED_ISSUES.length}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 whitespace-nowrap">
                          <LockIcon size={11} />
                          Полный отчёт
                        </span>
                      </div>

                      <div className="space-y-2">
                        {QC_BLURRED_ISSUES.map((text, i) => (
                          <div
                            key={i}
                            className="relative flex items-start gap-3 bg-rose-50 p-3 rounded-xl border border-rose-100 overflow-hidden"
                          >
                            {/* Alert dot — visible */}
                            <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                              <AlertIcon size={11} className="text-white" />
                            </div>

                            {/* Blurred text */}
                            <span
                              aria-hidden="true"
                              style={{
                                filter: 'blur(5px)',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                pointerEvents: 'none',
                                fontSize: '0.8125rem',
                                color: '#374151',
                                lineHeight: '1.45',
                                display: 'block',
                                flexGrow: 1,
                              }}
                            >
                              {text}
                            </span>

                            {/* Click-interceptor overlay */}
                            <div className="absolute inset-0 z-10" style={{ cursor: 'default' }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href="/register"
                      className="block w-full text-center px-6 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all"
                    >
                      Получить полный отчёт →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '15,000+', label: 'Проверок в день', icon: TrendingIcon },
              { value: '2,500+', label: 'Активных селлеров', icon: ShieldIcon },
              { value: '98%', label: 'Точность проверки', icon: ChartIcon },
              { value: '24/7', label: 'Мониторинг', icon: ZapIcon },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={24} className="text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Что мы проверяем</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Комплексный анализ по всем критическим параметрам</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldIcon,
                title: 'Юридическая проверка',
                description: 'Полное соответствие законодательству РФ',
                features: ['Соответствие ФЗ-289', 'Сертификаты Росаккредитации', 'Маркировка Честный Знак'],
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: WalletIcon,
                title: 'Финансовый анализ',
                description: 'Точный расчёт прибыли и рисков',
                features: ['Расчёт НДС 22% (2026)', 'Анализ маржинальности', 'Прогноз с учётом возвратов'],
                color: 'from-violet-500 to-purple-600',
              },
              {
                icon: ChartIcon,
                title: 'SEO и позиции',
                description: 'Мониторинг видимости и рейтинга',
                features: ['Анализ позиций в поиске', 'Детектор шадоубана', 'Оптимизация под 2026'],
                color: 'from-emerald-500 to-green-600',
              },
            ].map((feature, i) => (
              <div key={i} className="group bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-blue-200 hover:shadow-xl transition-all">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.features.map((item, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <CheckIcon size={18} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Выберите тариф</h2>
            <p className="text-xl text-gray-600">Прозрачное ценообразование без скрытых платежей</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Freemium', price: '0₽', period: 'навсегда',
                description: 'Для знакомства с сервисом',
                features: ['3 проверки в день', 'Базовый скоринг', 'Список проблем'],
                cta: 'Начать бесплатно', popular: false,
              },
              {
                name: 'Pro', price: '2,500₽', period: 'в месяц',
                description: 'Для профессионалов',
                features: ['Безлимитные проверки', 'Полный аудит + рекомендации', 'PDF отчёты', 'Telegram бот', 'Мониторинг 10 товаров'],
                cta: 'Выбрать Pro', popular: true,
              },
              {
                name: 'Enterprise', price: '15,000₽', period: 'в месяц',
                description: 'Для компаний',
                features: ['Всё из Pro', 'Мониторинг 100 товаров', 'API доступ', 'Приоритетная поддержка', 'Индивидуальные настройки'],
                cta: 'Связаться с нами', popular: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`relative rounded-2xl border-2 p-8 ${
                plan.popular
                  ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-violet-50 shadow-2xl scale-105'
                  : 'border-gray-200 bg-white'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold rounded-full">
                    Популярный
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-5xl font-bold text-gray-900 mb-2">{plan.price}</div>
                  <div className="text-gray-600">{plan.period}</div>
                  <p className="text-sm text-gray-500 mt-4">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckIcon size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
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
            ))}
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
            {[
              { title: 'Продукт', links: [{ label: 'Возможности', href: '/features' }, { label: 'Тарифы', href: '/pricing' }, { label: 'API', href: '/api-docs' }] },
              { title: 'Поддержка', links: [{ label: 'Документация', href: '/docs' }, { label: 'Контакты', href: '/contact' }, { label: 'FAQ', href: '/faq' }] },
              { title: 'Компания', links: [{ label: 'О нас', href: '/about' }, { label: 'Политика', href: '/privacy' }, { label: 'Условия', href: '/terms' }] },
            ].map((column, i) => (
              <div key={i}>
                <h4 className="font-bold mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link, j) => (
                    <li key={j}>
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
