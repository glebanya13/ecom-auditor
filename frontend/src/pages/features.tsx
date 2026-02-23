import Head from 'next/head';
import Link from 'next/link';
import {
  ShieldIcon, ChartIcon, WalletIcon, CheckIcon, ArrowRightIcon,
  ZapIcon, SearchIcon, AlertIcon, TrendingIcon, DocumentIcon, LockIcon,
  LogoIcon, CloseIcon
} from '../components/Icons';

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

export default function Features() {
  return (
    <>
      <Head>
        <title>Возможности — E-Com Auditor</title>
        <meta name="description" content="Полный список возможностей E-Com Auditor: юридическая проверка, финансовый анализ, SEO мониторинг и защита от шадоубана." />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-8">
            <ZapIcon size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Все возможности платформы</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Комплексный аудит<br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              для маркетплейсов
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            E-Com Auditor автоматически проверяет товары по всем критическим параметрам: законодательство, финансы, SEO и защита от блокировок.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl inline-flex items-center gap-3 hover:shadow-xl hover:shadow-blue-500/25 transition-all">
              Начать бесплатно
              <ArrowRightIcon size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/pricing" className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-xl hover:border-gray-300 transition-colors">
              Посмотреть тарифы
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Три направления аудита</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Полное покрытие всех рисков для вашего бизнеса на маркетплейсах</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Legal */}
            <div className="group bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-blue-200 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldIcon size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Юридическая проверка</h3>
              <p className="text-gray-600 mb-6">Полное соответствие законодательству РФ с актуальными базами данных</p>
              <ul className="space-y-3">
                {[
                  'Проверка по ФЗ-289 (таможня)',
                  'Сертификаты Росаккредитации',
                  'Маркировка Честный Знак',
                  'Декларации соответствия',
                  'Разрешительная документация',
                  'Проверка ОКВЭД продавца',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckIcon size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Financial */}
            <div className="group bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-violet-200 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <WalletIcon size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Финансовый анализ</h3>
              <p className="text-gray-600 mb-6">Точный расчёт прибыли с учётом всех комиссий и изменений 2026 года</p>
              <ul className="space-y-3">
                {[
                  'Расчёт НДС 22% (с 2026 года)',
                  'Комиссии маркетплейса',
                  'Стоимость логистики',
                  'Анализ маржинальности',
                  'Прогноз с учётом возвратов',
                  'Точка безубыточности',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckIcon size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SEO */}
            <div className="group bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-emerald-200 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChartIcon size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">SEO и позиции</h3>
              <p className="text-gray-600 mb-6">Мониторинг видимости и защита от алгоритмических блокировок</p>
              <ul className="space-y-3">
                {[
                  'Анализ позиций в поиске',
                  'Детектор шадоубана',
                  'Качество описания товара',
                  'Оптимизация ключевых слов',
                  'Рейтинг и отзывы',
                  'Конкурентный анализ',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckIcon size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Дополнительные инструменты</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Всё необходимое для профессиональной работы с маркетплейсами</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: AlertIcon, color: 'bg-rose-100 text-rose-600', title: 'Риск-алерты', desc: 'Мгновенные уведомления о критических нарушениях и угрозах блокировки' },
              { icon: TrendingIcon, color: 'bg-blue-100 text-blue-600', title: 'Мониторинг 24/7', desc: 'Непрерывное отслеживание статуса товаров и изменений на маркетплейсе' },
              { icon: DocumentIcon, color: 'bg-violet-100 text-violet-600', title: 'PDF отчёты', desc: 'Детальные отчёты для предоставления клиентам и бизнес-анализа' },
              { icon: SearchIcon, color: 'bg-emerald-100 text-emerald-600', title: 'Массовая проверка', desc: 'Одновременная проверка сотен SKU с сортировкой по уровню риска' },
              { icon: LockIcon, color: 'bg-amber-100 text-amber-600', title: 'Безопасность данных', desc: 'Все данные хранятся в зашифрованном виде на серверах в России' },
              { icon: ZapIcon, color: 'bg-indigo-100 text-indigo-600', title: 'Telegram бот', desc: 'Уведомления и быстрые проверки прямо в мессенджере — без входа в сервис' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Сравнение с аналогами</h2>
            <p className="text-xl text-gray-600">Почему E-Com Auditor — лучший выбор</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 font-bold text-gray-900 rounded-tl-xl">Функция</th>
                  <th className="py-4 px-6 font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 text-center">E-Com Auditor</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-center">Конкурент А</th>
                  <th className="py-4 px-6 font-bold text-gray-600 text-center rounded-tr-xl">Ручная проверка</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Проверка ФЗ-289', true, false, false],
                  ['Расчёт НДС 22%', true, false, true],
                  ['Детектор шадоубана', true, true, false],
                  ['Мониторинг 24/7', true, false, false],
                  ['PDF отчёты', true, true, true],
                  ['Telegram уведомления', true, false, false],
                  ['API доступ', true, true, false],
                  ['Массовая проверка', true, false, false],
                ].map(([feature, ea, comp, manual], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-4 px-6 text-gray-700 font-medium">{feature as string}</td>
                    <td className="py-4 px-6 text-center">
                      {ea ? <CheckIcon size={20} className="text-emerald-500 mx-auto" /> : <CloseIcon size={20} className="text-gray-300 mx-auto" />}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {comp ? <CheckIcon size={20} className="text-emerald-500 mx-auto" /> : <CloseIcon size={20} className="text-gray-300 mx-auto" />}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {manual ? <CheckIcon size={20} className="text-emerald-500 mx-auto" /> : <CloseIcon size={20} className="text-gray-300 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Готовы начать?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Первые 3 проверки бесплатно — без карты и без обязательств</p>
          <Link href="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transition-all text-lg">
            Начать бесплатно
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
