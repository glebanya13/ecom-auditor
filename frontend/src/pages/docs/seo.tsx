import Head from 'next/head';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon, ChartIcon, AlertIcon , LogoIcon } from '../../components/Icons';

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
  { href: '/docs/finance', label: 'Финансовый анализ' },
  { href: '/docs/seo', label: 'SEO и мониторинг', active: true },
  { href: '/docs/reports', label: 'Отчёты и экспорт' },
  { href: '/docs/api', label: 'API интеграция' },
];

const ARTICLES = [
  {
    id: 'positions',
    title: 'Мониторинг позиций',
    blocks: [
      { type: 'text', value: 'Мониторинг позиций отслеживает место вашего товара в результатах поиска маркетплейса по ключевым запросам. Это критично для понимания динамики продаж.' },
      { type: 'list', title: 'Что отслеживается:', items: ['Позиция в органической выдаче по основным запросам', 'Позиция в категории (каталоге)', 'Динамика изменений за 7, 14, 30 дней', 'Видимость в рекомендациях и похожих товарах'] },
      { type: 'note', value: 'Мониторинг позиций доступен на тарифах Pro (до 10 товаров) и Enterprise (до 100 товаров). Обновление данных — 2 раза в сутки.' },
    ],
  },
  {
    id: 'shadowban',
    title: 'Детектор шадоубана',
    blocks: [
      { type: 'text', value: 'Шадоубан (Shadow Ban) — скрытое понижение видимости товара в поиске без явного уведомления продавца. Маркетплейсы применяют его при подозрении на накрутку, нарушение правил или технические ошибки.' },
      { type: 'list', title: 'Признаки шадоубана:', items: ['Резкое падение показов при неизменных позициях', 'Снижение кликабельности (CTR) без изменения карточки', 'Товар не находится по точному поисковому запросу', 'Значительное расхождение между внутренней и внешней аналитикой'] },
      {
        type: 'warning',
        value: 'Не путайте шадоубан с сезонным падением спроса или изменением алгоритмов ранжирования. Детектор E-Com Auditor анализирует несколько факторов одновременно.',
      },
      { type: 'list', title: 'Что делать при обнаружении шадоубана:', items: ['Проверьте карточку товара на соответствие правилам маркетплейса', 'Убедитесь в отсутствии запрещённых слов в названии и описании', 'Проверьте отзывы на предмет жалоб и спама', 'Обратитесь в поддержку маркетплейса с конкретными данными'] },
    ],
  },
  {
    id: 'reviews',
    title: 'Анализ отзывов',
    blocks: [
      { type: 'text', value: 'Отзывы и рейтинг — ключевые факторы ранжирования на маркетплейсах. E-Com Auditor анализирует качество и динамику отзывов для выявления потенциальных проблем.' },
      { type: 'list', title: 'Что анализируется:', items: ['Средний рейтинг и динамика его изменения', 'Количество отзывов относительно конкурентов', 'Доля негативных отзывов (1–2 звезды)', 'Наличие повторяющихся жалоб (системные проблемы)', 'Признаки накрутки или неестественного роста'] },
      { type: 'tip', value: 'Товары с рейтингом ниже 4.0 получают штраф в ранжировании на большинстве маркетплейсов. Отслеживайте динамику и реагируйте на негатив быстро.' },
    ],
  },
  {
    id: 'competitors',
    title: 'Конкурентный анализ',
    blocks: [
      { type: 'text', value: 'Конкурентный анализ показывает, как ваш товар выглядит на фоне похожих предложений в категории.' },
      { type: 'list', title: 'Показатели сравнения:', items: ['Цена: ваш товар vs среднее по категории и топ-10', 'Рейтинг и количество отзывов', 'Качество фотографий и описания (по шкале 0–100)', 'Используемые ключевые слова', 'Динамика продаж (только Enterprise)'] },
      { type: 'note', value: 'Данные конкурентного анализа обновляются раз в 24 часа. Для более частых обновлений используйте API.' },
    ],
  },
];

export default function SeoDocs() {
  return (
    <>
      <Head>
        <title>SEO и мониторинг — Документация E-Com Auditor</title>
        <meta name="description" content="Мониторинг позиций, детектор шадоубана, анализ отзывов и конкурентный анализ." />
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
            <span className="text-gray-900 font-medium">SEO и мониторинг</span>
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
                    {ARTICLES.map((a) => <a key={a.id} href={`#${a.id}`} className="block px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors border-l-2 border-transparent hover:border-blue-400 pl-3">{a.title}</a>)}
                  </nav>
                </div>
              </div>
            </aside>

            <main className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <ChartIcon size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">SEO и мониторинг</h1>
                  <p className="text-gray-500 text-sm">Позиции, шадоубан, отзывы и конкуренты</p>
                </div>
              </div>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">Отслеживание видимости товаров, обнаружение алгоритмических блокировок и конкурентный анализ.</p>

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
                        return null;
                      })}
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between">
                <Link href="/docs/finance" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors">← Финансовый анализ</Link>
                <Link href="/docs/reports" className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">Отчёты и экспорт <ArrowRightIcon size={18} /></Link>
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
