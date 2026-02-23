import Head from 'next/head';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon, DocumentIcon , LogoIcon } from '../../components/Icons';

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
  { href: '/docs/seo', label: 'SEO и мониторинг' },
  { href: '/docs/reports', label: 'Отчёты и экспорт', active: true },
  { href: '/docs/api', label: 'API интеграция' },
];

const ARTICLES = [
  {
    id: 'pdf',
    title: 'PDF отчёты',
    blocks: [
      { type: 'text', value: 'PDF отчёт — полная версия результатов аудита, оформленная для предоставления клиентам, партнёрам или для внутреннего использования.' },
      { type: 'list', title: 'Что входит в PDF отчёт:', items: ['Сводная информация о товаре и дата проверки', 'Общий скоринг и его расшифровка', 'Все найденные нарушения с описанием и ссылками на нормативные акты', 'Финансовый анализ: маржинальность, точка безубыточности', 'Конкретные рекомендации по каждой найденной проблеме', 'История изменений (при повторных проверках)'] },
      { type: 'steps', items: ['Откройте результат нужной проверки в личном кабинете', 'Нажмите кнопку «Скачать PDF» в правом верхнем углу', 'Выберите язык отчёта (русский или английский)', 'Дождитесь генерации (обычно 5–10 секунд) и сохраните файл'] },
      { type: 'note', value: 'PDF отчёты доступны на тарифах Pro и Enterprise. На Freemium можно просмотреть краткую сводку, но без скачивания.' },
    ],
  },
  {
    id: 'excel',
    title: 'Экспорт в Excel',
    blocks: [
      { type: 'text', value: 'Экспорт данных в Excel (формат .xlsx) позволяет работать с результатами аудита в таблицах, строить сводные отчёты и интегрировать данные в собственные системы аналитики.' },
      { type: 'list', title: 'Доступные экспорты:', items: ['Результаты одной проверки — все данные аудита в одном листе', 'Массовый экспорт — список всех проверок за период с ключевыми показателями', 'История мониторинга — динамика скоринга по товарам за выбранный период', 'Финансовый анализ — все расчёты по себестоимости и прибыли'] },
      { type: 'tip', value: 'При массовом экспорте можно выбрать только определённые колонки, чтобы уменьшить размер файла. Фильтрация по дате и маркетплейсу тоже доступна.' },
    ],
  },
  {
    id: 'history',
    title: 'История проверок',
    blocks: [
      { type: 'text', value: 'История проверок хранит все ваши аудиты и позволяет отслеживать динамику изменений скоринга товара во времени.' },
      { type: 'list', title: 'Возможности:', items: ['Просмотр всех проверок с фильтрацией по дате, маркетплейсу, SKU', 'Сравнение результатов двух проверок одного товара', 'График изменения скоринга во времени', 'Уведомления при ухудшении показателей'] },
      {
        type: 'note',
        value: 'Срок хранения: Freemium — 7 дней, Pro — 90 дней, Enterprise — без ограничений.',
      },
    ],
  },
  {
    id: 'archive',
    title: 'Архив аудитов',
    blocks: [
      { type: 'text', value: 'Архив позволяет хранить результаты проверок дольше стандартного срока и организовывать их по проектам или брендам.' },
      { type: 'list', title: 'Функции архива:', items: ['Создание папок/проектов для организации аудитов', 'Добавление тегов и заметок к проверкам', 'Поиск по архиву по SKU, дате, скорингу', 'Расширенный срок хранения (доступно в Enterprise)'] },
      { type: 'tip', value: 'Используйте архив для хранения «снимков» состояния товаров перед крупными кампаниями или сезонными акциями — это позволит сравнить результаты до и после.' },
    ],
  },
];

export default function ReportsDocs() {
  return (
    <>
      <Head>
        <title>Отчёты и экспорт — Документация E-Com Auditor</title>
        <meta name="description" content="PDF отчёты, экспорт в Excel, история проверок и архив аудитов в E-Com Auditor." />
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
            <span className="text-gray-900 font-medium">Отчёты и экспорт</span>
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
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center">
                  <DocumentIcon size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Отчёты и экспорт</h1>
                  <p className="text-gray-500 text-sm">PDF, Excel и история проверок</p>
                </div>
              </div>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">Создание и экспорт отчётов, управление историей проверок и архивирование данных аудита.</p>

              <div className="space-y-14">
                {ARTICLES.map((article) => (
                  <article key={article.id} id={article.id} className="scroll-mt-28">
                    <h2 className="text-2xl font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">{article.title}</h2>
                    <div className="space-y-4">
                      {article.blocks.map((block, i) => {
                        if (block.type === 'text') return <p key={i} className="text-gray-600 leading-relaxed">{block.value}</p>;
                        if (block.type === 'note') return <div key={i} className="p-4 bg-blue-50 border border-blue-200 rounded-xl"><p className="text-blue-800 text-sm leading-relaxed"><strong>Примечание:</strong> {block.value}</p></div>;
                        if (block.type === 'tip') return <div key={i} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"><p className="text-emerald-800 text-sm leading-relaxed"><strong>Совет:</strong> {block.value}</p></div>;
                        if (block.type === 'list') return (
                          <div key={i}>
                            {block.title && <p className="font-semibold text-gray-900 mb-3">{block.title}</p>}
                            <ul className="space-y-2">{block.items!.map((item, j) => <li key={j} className="flex items-start gap-3"><CheckIcon size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" /><span className="text-gray-700 leading-relaxed">{item}</span></li>)}</ul>
                          </div>
                        );
                        if (block.type === 'steps') return (
                          <ol key={i} className="space-y-3">
                            {block.items!.map((item, j) => (
                              <li key={j} className="flex items-start gap-3">
                                <span className="w-7 h-7 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold mt-0.5">{j + 1}</span>
                                <span className="text-gray-700 leading-relaxed pt-0.5">{item}</span>
                              </li>
                            ))}
                          </ol>
                        );
                        return null;
                      })}
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between">
                <Link href="/docs/seo" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors">← SEO и мониторинг</Link>
                <Link href="/docs/api" className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">API интеграция <ArrowRightIcon size={18} /></Link>
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
