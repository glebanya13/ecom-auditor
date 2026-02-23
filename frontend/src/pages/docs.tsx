import Head from 'next/head';
import Link from 'next/link';
import { ZapIcon, DocumentIcon, ShieldIcon, WalletIcon, ChartIcon, ArrowRightIcon, SearchIcon , LogoIcon } from '../components/Icons';

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

const SECTIONS = [
  {
    icon: ZapIcon,
    color: 'from-blue-500 to-blue-600',
    title: 'Быстрый старт',
    href: '/docs/quick-start',
    desc: 'Начните работу за 5 минут: регистрация, первая проверка, интерпретация результатов.',
    articles: [
      { label: 'Регистрация и вход', href: '/docs/quick-start#registration' },
      { label: 'Первая проверка SKU', href: '/docs/quick-start#first-check' },
      { label: 'Как читать отчёт', href: '/docs/quick-start#reading-report' },
      { label: 'Личный кабинет', href: '/docs/quick-start#dashboard' },
    ],
  },
  {
    icon: ShieldIcon,
    color: 'from-violet-500 to-purple-600',
    title: 'Аудит и проверки',
    href: '/docs/audit',
    desc: 'Подробное руководство по всем типам проверок и интерпретации результатов.',
    articles: [
      { label: 'Юридическая проверка', href: '/docs/audit#legal-check' },
      { label: 'Сертификаты и маркировка', href: '/docs/audit#certificates' },
      { label: 'Проверка по ФЗ-289', href: '/docs/audit#fz289' },
      { label: 'Уровни риска', href: '/docs/audit#risk-levels' },
    ],
  },
  {
    icon: WalletIcon,
    color: 'from-emerald-500 to-green-600',
    title: 'Финансовый анализ',
    href: '/docs/finance',
    desc: 'Как работает калькулятор прибыли с учётом НДС 22% и новых условий 2026 года.',
    articles: [
      { label: 'Расчёт маржинальности', href: '/docs/finance#margin' },
      { label: 'НДС 22% с 2026 года', href: '/docs/finance#vat' },
      { label: 'Комиссии маркетплейсов', href: '/docs/finance#commissions' },
      { label: 'Точка безубыточности', href: '/docs/finance#breakeven' },
    ],
  },
  {
    icon: ChartIcon,
    color: 'from-amber-500 to-orange-600',
    title: 'SEO и мониторинг',
    href: '/docs/seo',
    desc: 'Отслеживание позиций, обнаружение шадоубана и оптимизация видимости товаров.',
    articles: [
      { label: 'Мониторинг позиций', href: '/docs/seo#positions' },
      { label: 'Детектор шадоубана', href: '/docs/seo#shadowban' },
      { label: 'Анализ отзывов', href: '/docs/seo#reviews' },
      { label: 'Конкурентный анализ', href: '/docs/seo#competitors' },
    ],
  },
  {
    icon: DocumentIcon,
    color: 'from-rose-500 to-red-600',
    title: 'Отчёты и экспорт',
    href: '/docs/reports',
    desc: 'Создание PDF отчётов, экспорт данных и работа с историей проверок.',
    articles: [
      { label: 'PDF отчёты', href: '/docs/reports#pdf' },
      { label: 'Экспорт в Excel', href: '/docs/reports#excel' },
      { label: 'История проверок', href: '/docs/reports#history' },
      { label: 'Архив аудитов', href: '/docs/reports#archive' },
    ],
  },
  {
    icon: SearchIcon,
    color: 'from-indigo-500 to-indigo-600',
    title: 'API интеграция',
    href: '/docs/api',
    desc: 'Документация REST API для разработчиков и руководство по интеграции.',
    articles: [
      { label: 'Авторизация', href: '/docs/api#auth' },
      { label: 'Основные эндпоинты', href: '/docs/api#endpoints' },
      { label: 'Примеры запросов', href: '/docs/api#examples' },
      { label: 'Лимиты и коды ошибок', href: '/docs/api#limits-errors' },
    ],
  },
];

export default function Docs() {
  return (
    <>
      <Head>
        <title>Документация — E-Com Auditor</title>
        <meta name="description" content="Полная документация E-Com Auditor: быстрый старт, аудит, финансовый анализ, SEO мониторинг и API." />
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
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-8">
            <DocumentIcon size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Документация</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Всё, что нужно<br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              для работы с сервисом
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Подробные руководства, примеры и справочники для эффективного использования E-Com Auditor
          </p>
        </div>
      </section>

      {/* Quick start banner */}
      <section className="pb-8 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Новый пользователь?</h2>
              <p className="text-blue-100">Начните с нашего руководства по быстрому старту — от регистрации до первого аудита за 5 минут</p>
            </div>
            <Link href="/register" className="flex-shrink-0 inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:shadow-xl transition-all">
              Начать бесплатно
              <ArrowRightIcon size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Sections grid */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SECTIONS.map((section, i) => (
              <div key={i} className="group bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-blue-200 hover:shadow-xl transition-all">
                <div className={`w-14 h-14 bg-gradient-to-br ${section.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <section.icon size={28} className="text-white" />
                </div>
                <Link href={section.href} className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors block">{section.title}</Link>
                <p className="text-gray-600 text-sm mb-5 leading-relaxed">{section.desc}</p>
                <ul className="space-y-2">
                  {section.articles.map((article) => (
                    <li key={article.href} className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600">→</span>
                      <Link href={article.href} className="text-gray-700 hover:text-blue-600 transition-colors">{article.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular articles */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">Популярные статьи</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Как проверить товар на WB за 30 секунд', tag: 'Быстрый старт', time: '3 мин', href: '/docs/quick-start#first-check' },
              { title: 'НДС 22% в 2026: что изменилось для селлеров', tag: 'Финансы', time: '5 мин', href: '/docs/finance#vat' },
              { title: 'Что такое шадоубан и как его обнаружить', tag: 'SEO', time: '4 мин', href: '/docs/seo#shadowban' },
              { title: 'ФЗ-289: полный гид по требованиям 2026', tag: 'Юридическое', time: '8 мин', href: '/docs/audit#fz289' },
              { title: 'Как настроить Telegram уведомления', tag: 'Интеграция', time: '2 мин', href: '/docs/quick-start#dashboard' },
              { title: 'Расчёт рентабельности: пошаговый гид', tag: 'Финансы', time: '6 мин', href: '/docs/finance#margin' },
            ].map((article, i) => (
              <Link key={i} href={article.href} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DocumentIcon size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{article.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{article.tag} · {article.time} чтения</div>
                  </div>
                </div>
                <ArrowRightIcon size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help block */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-gray-50 rounded-2xl p-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Не нашли ответ?</h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">Наша команда поддержки готова помочь с любыми вопросами о работе сервиса</p>
            <Link href="/contact" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all">
              Написать в поддержку
              <ArrowRightIcon size={20} />
            </Link>
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
