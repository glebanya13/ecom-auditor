import Head from 'next/head';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon, WalletIcon, AlertIcon , LogoIcon } from '../../components/Icons';

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

const DOC_SECTIONS = [
  { href: '/docs/quick-start', label: 'Быстрый старт' },
  { href: '/docs/audit', label: 'Аудит и проверки' },
  { href: '/docs/finance', label: 'Финансовый анализ', active: true },
  { href: '/docs/seo', label: 'SEO и мониторинг' },
  { href: '/docs/reports', label: 'Отчёты и экспорт' },
  { href: '/docs/api', label: 'API интеграция' },
];

const ARTICLES = [
  {
    id: 'margin',
    title: 'Расчёт маржинальности',
    blocks: [
      { type: 'text', value: 'Финансовый анализ в E-Com Auditor рассчитывает реальную прибыль с учётом всех расходов на маркетплейсе. Введите себестоимость товара — остальное система посчитает автоматически.' },
      { type: 'list', title: 'Из чего складывается расчёт:', items: ['Себестоимость товара (вводится вручную)', 'Комиссия маркетплейса (берётся из актуальных тарифов WB/Ozon)', 'Стоимость доставки до склада маркетплейса', 'Стоимость хранения (при хранении на складе)', 'Возвраты (процент рассчитывается по категории товара)', 'НДС 22% (для плательщиков НДС)', 'Прибыль = Цена продажи − Все расходы'] },
      { type: 'tip', value: 'Укажите вашу систему налогообложения в настройках профиля — это позволит точнее рассчитывать налоговую нагрузку.' },
    ],
  },
  {
    id: 'vat',
    title: 'НДС 22% с 2026 года',
    blocks: [
      { type: 'text', value: 'С 1 января 2026 года базовая ставка НДС в России изменилась с 20% до 22%. Это существенно повлияло на финансовую модель продавцов, работающих на общей системе налогообложения.' },
      {
        type: 'warning',
        value: 'Если вы работаете на ОСНО и являетесь плательщиком НДС, пересчитайте рентабельность всех товаров с учётом новой ставки. E-Com Auditor уже использует ставку 22% во всех расчётах.',
      },
      { type: 'list', title: 'Кого затрагивают изменения:', items: ['Компании и ИП на общей системе налогообложения (ОСНО)', 'Продавцы, утратившие право на УСН из-за превышения лимитов', 'Импортёры товаров — НДС при ввозе также 22%'] },
      { type: 'list', title: 'Кого НЕ затрагивают:', items: ['ИП и компании на УСН (доходы) и УСН (доходы − расходы)', 'Самозанятые (плательщики НПД)', 'Продавцы товаров с льготной ставкой НДС 10% (продукты питания, детские товары и т.д.)'] },
    ],
  },
  {
    id: 'commissions',
    title: 'Комиссии маркетплейсов',
    blocks: [
      { type: 'text', value: 'Комиссии маркетплейсов варьируются от 5% до 25% в зависимости от категории товара. E-Com Auditor автоматически определяет актуальную комиссию по категории проверяемого SKU.' },
      {
        type: 'commission-table',
        headers: ['Категория', 'Wildberries', 'Ozon'],
        rows: [
          ['Одежда и обувь', '15–25%', '15–22%'],
          ['Электроника', '5–10%', '5–8%'],
          ['Товары для дома', '8–12%', '8–15%'],
          ['Косметика', '12–18%', '10–15%'],
          ['Продукты питания', '5–8%', '5–7%'],
          ['Детские товары', '8–15%', '8–12%'],
        ],
      },
      { type: 'note', value: 'Комиссии регулярно меняются. База данных комиссий обновляется еженедельно на основе официальных тарифов маркетплейсов.' },
    ],
  },
  {
    id: 'breakeven',
    title: 'Точка безубыточности',
    blocks: [
      { type: 'text', value: 'Точка безубыточности (BEP — Break-Even Point) — это минимальная цена продажи, при которой вы не уходите в убыток. E-Com Auditor рассчитывает её автоматически.' },
      { type: 'list', title: 'Что учитывается при расчёте BEP:', items: ['Себестоимость товара', 'Все комиссии и расходы на доставку', 'Средний процент возвратов по категории', 'НДС (если применимо)', 'Минимальная целевая маржа (настраивается)'] },
      { type: 'tip', value: 'Установите целевую маржу в настройках (по умолчанию 20%). Тогда «точка безубыточности» фактически станет минимальной ценой для достижения целевой прибыльности.' },
    ],
  },
];

export default function FinanceDocs() {
  return (
    <>
      <Head>
        <title>Финансовый анализ — Документация E-Com Auditor</title>
        <meta name="description" content="Расчёт маржинальности, НДС 22%, комиссии маркетплейсов и точка безубыточности." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

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

      <div className="pt-20 min-h-screen bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/docs" className="hover:text-blue-600 transition-colors">Документация</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Финансовый анализ</span>
          </div>

          <div className="grid lg:grid-cols-4 gap-12">
            <aside className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="mb-6">
                  <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mb-4">← Все разделы</Link>
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">Разделы</h3>
                  <nav className="space-y-1">
                    {DOC_SECTIONS.map((s) => (
                      <Link key={s.href} href={s.href} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${ s.active ? 'bg-blue-50 text-blue-600 font-semibold border-l-2 border-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' }`}>{s.label}</Link>
                    ))}
                  </nav>
                </div>
                <div className="mt-6">
                  <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">На этой странице</h3>
                  <nav className="space-y-1">
                    {ARTICLES.map((a) => (
                      <a key={a.id} href={`#${a.id}`} className="block px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors border-l-2 border-transparent hover:border-blue-400 pl-3">{a.title}</a>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            <main className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <WalletIcon size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Финансовый анализ</h1>
                  <p className="text-gray-500 text-sm">Расчёт прибыли с учётом НДС 22%</p>
                </div>
              </div>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">Как работает калькулятор прибыли, как учитывается НДС 22% и как рассчитываются комиссии маркетплейсов.</p>

              <div className="space-y-14">
                {ARTICLES.map((article) => (
                  <article key={article.id} id={article.id} className="scroll-mt-28">
                    <h2 className="text-2xl font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">{article.title}</h2>
                    <div className="space-y-4">
                      {article.blocks.map((block, i) => {
                        if (block.type === 'text') return <p key={i} className="text-gray-600 leading-relaxed">{block.value}</p>;
                        if (block.type === 'note') return <div key={i} className="p-4 bg-blue-50 border border-blue-200 rounded-xl"><p className="text-blue-800 text-sm leading-relaxed"><strong>Примечание:</strong> {block.value}</p></div>;
                        if (block.type === 'tip') return <div key={i} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"><p className="text-emerald-800 text-sm leading-relaxed"><strong>Совет:</strong> {block.value}</p></div>;
                        if (block.type === 'warning') return <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3"><AlertIcon size={18} className="text-amber-600 flex-shrink-0 mt-0.5" /><p className="text-amber-800 text-sm leading-relaxed">{block.value}</p></div>;
                        if (block.type === 'list') return (
                          <div key={i}>
                            {block.title && <p className="font-semibold text-gray-900 mb-3">{block.title}</p>}
                            <ul className="space-y-2">{block.items!.map((item, j) => <li key={j} className="flex items-start gap-3"><CheckIcon size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" /><span className="text-gray-700 leading-relaxed">{item}</span></li>)}</ul>
                          </div>
                        );
                        if (block.type === 'commission-table') return (
                          <div key={i} className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead className="bg-gray-50">
                                <tr>{block.headers!.map((h, j) => <th key={j} className="text-left py-3 px-4 font-bold text-gray-700 text-sm border-b border-gray-200">{h}</th>)}</tr>
                              </thead>
                              <tbody>{block.rows!.map((row, j) => <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>{row.map((cell, k) => <td key={k} className="py-3 px-4 text-gray-700 text-sm border-b border-gray-100">{cell}</td>)}</tr>)}</tbody>
                            </table>
                          </div>
                        );
                        return null;
                      })}
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between">
                <Link href="/docs/audit" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors">← Аудит и проверки</Link>
                <Link href="/docs/seo" className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">SEO и мониторинг <ArrowRightIcon size={18} /></Link>
              </div>
            </main>
          </div>
        </div>
      </div>

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
                <ul className="space-y-3">{column.links.map((link) => <li key={link.href}><Link href={link.href} className="text-gray-400 hover:text-white transition-colors">{link.label}</Link></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">© 2026 E-Com Auditor. Все права защищены.</div>
        </div>
      </footer>
    </>
  );
}
