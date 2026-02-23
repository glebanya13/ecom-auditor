import Head from 'next/head';
import Link from 'next/link';
import { CheckIcon, SearchIcon, LockIcon, AlertIcon , LogoIcon } from '../../components/Icons';

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
  { href: '/docs/reports', label: 'Отчёты и экспорт' },
  { href: '/docs/api', label: 'API интеграция', active: true },
];

const ARTICLES = [
  {
    id: 'auth',
    title: 'Авторизация',
    blocks: [
      { type: 'text', value: 'API E-Com Auditor использует Bearer-токен авторизацию. Токен передаётся в заголовке Authorization каждого запроса.' },
      { type: 'code', lang: 'bash', value: `# Получить токен
curl -X POST https://api.ecomauditor.ru/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"email": "you@example.com", "password": "your_password"}'

# Ответ
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 86400
}` },
      { type: 'list', title: 'Использование токена:', items: ['Добавьте заголовок Authorization: Bearer <ваш_токен> в каждый запрос', 'Токен действителен 24 часа', 'При истечении получите новый токен повторной авторизацией', 'Никогда не публикуйте токен в публичных репозиториях'] },
    ],
  },
  {
    id: 'endpoints',
    title: 'Основные эндпоинты',
    blocks: [
      { type: 'text', value: 'Базовый URL всех запросов: https://api.ecomauditor.ru/v1' },
      { type: 'code', lang: 'bash', value: `# Быстрая проверка (без авторизации)
POST /audit/quick
Body: { "sku_id": "123456789", "marketplace": "wildberries" }

# Полный аудит (требуется авторизация)
POST /audit/full
Body: { "sku_id": "123456789", "marketplace": "ozon", "cost_price": 500 }

# Получить результат аудита
GET /audit/{audit_id}

# Список товаров
GET /products
GET /products/{product_id}
POST /products    # добавить на мониторинг
DELETE /products/{product_id}

# Отчёты
GET /reports
GET /reports/{report_id}/pdf` },
    ],
  },
  {
    id: 'examples',
    title: 'Примеры запросов',
    blocks: [
      { type: 'text', value: 'Полные примеры с телом запроса и ответом.' },
      { type: 'code', lang: 'bash', value: `# Полный аудит товара
curl -X POST https://api.ecomauditor.ru/v1/audit/full \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sku_id": "987654321",
    "marketplace": "wildberries",
    "cost_price": 1200,
    "tax_system": "usn"
  }'` },
      { type: 'code', lang: 'json', value: `// Пример ответа
{
  "audit_id": "aud_abc123",
  "sku_id": "987654321",
  "marketplace": "wildberries",
  "score": 65,
  "status": "warning",
  "issues": [
    {
      "type": "legal",
      "severity": "high",
      "title": "Отсутствует декларация соответствия",
      "description": "Товар подлежит обязательному декларированию..."
    }
  ],
  "finance": {
    "margin_percent": 18.5,
    "breakeven_price": 2140,
    "vat_amount": 198
  },
  "created_at": "2026-02-20T10:00:00Z"
}` },
    ],
  },
  {
    id: 'limits-errors',
    title: 'Лимиты и коды ошибок',
    blocks: [
      { type: 'list', title: 'Лимиты запросов по тарифам:', items: ['Freemium: 5 запросов/минуту, 50 в день', 'Pro: 60 запросов/минуту, 10 000 в день', 'Enterprise: 600 запросов/минуту, без дневного лимита'] },
      {
        type: 'error-table',
        rows: [
          { code: '200', title: 'OK', desc: 'Запрос выполнен успешно' },
          { code: '400', title: 'Bad Request', desc: 'Неверные параметры запроса. Проверьте тело запроса.' },
          { code: '401', title: 'Unauthorized', desc: 'Токен отсутствует или недействителен.' },
          { code: '403', title: 'Forbidden', desc: 'Функция недоступна на вашем тарифе.' },
          { code: '404', title: 'Not Found', desc: 'Ресурс не найден (неверный ID аудита или SKU).' },
          { code: '429', title: 'Too Many Requests', desc: 'Превышен лимит запросов. Подождите и повторите.' },
          { code: '500', title: 'Server Error', desc: 'Внутренняя ошибка сервера. Обратитесь в поддержку.' },
        ],
      },
      { type: 'tip', value: 'При получении ошибки 429 проверьте заголовок Retry-After — он содержит количество секунд, через которые можно повторить запрос.' },
    ],
  },
];

export default function ApiDocsDocs() {
  return (
    <>
      <Head>
        <title>API интеграция — Документация E-Com Auditor</title>
        <meta name="description" content="Авторизация, эндпоинты, примеры запросов и коды ошибок API E-Com Auditor." />
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
            <span className="text-gray-900 font-medium">API интеграция</span>
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
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <SearchIcon size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">API интеграция</h1>
                  <p className="text-gray-500 text-sm">REST API для разработчиков</p>
                </div>
              </div>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">Документация REST API: авторизация, эндпоинты, примеры и справочник кодов ошибок.</p>

              <div className="space-y-14">
                {ARTICLES.map((article) => (
                  <article key={article.id} id={article.id} className="scroll-mt-28">
                    <h2 className="text-2xl font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">{article.title}</h2>
                    <div className="space-y-4">
                      {article.blocks.map((block, i) => {
                        if (block.type === 'text') return <p key={i} className="text-gray-600 leading-relaxed">{block.value}</p>;
                        if (block.type === 'tip') return <div key={i} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"><p className="text-emerald-800 text-sm leading-relaxed"><strong>Совет:</strong> {block.value}</p></div>;
                        if (block.type === 'list') return (
                          <div key={i}>
                            {block.title && <p className="font-semibold text-gray-900 mb-3">{block.title}</p>}
                            <ul className="space-y-2">{block.items!.map((item, j) => <li key={j} className="flex items-start gap-3"><CheckIcon size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" /><span className="text-gray-700 leading-relaxed">{item}</span></li>)}</ul>
                          </div>
                        );
                        if (block.type === 'code') return (
                          <div key={i} className="bg-gray-900 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
                              <span className="text-gray-400 text-xs font-mono">{block.lang}</span>
                            </div>
                            <pre className="p-5 text-sm font-mono text-gray-100 leading-relaxed overflow-x-auto">{block.value}</pre>
                          </div>
                        );
                        if (block.type === 'error-table') return (
                          <div key={i} className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm border-b border-gray-200">Код</th>
                                  <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm border-b border-gray-200">Статус</th>
                                  <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm border-b border-gray-200">Описание</th>
                                </tr>
                              </thead>
                              <tbody>
                                {block.rows!.map((row: any, j: number) => (
                                  <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="py-3 px-4 border-b border-gray-100">
                                      <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${row.code.startsWith('2') ? 'bg-emerald-100 text-emerald-700' : row.code.startsWith('4') || row.code.startsWith('5') ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>{row.code}</span>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-sm text-gray-700 border-b border-gray-100">{row.title}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600 border-b border-gray-100">{row.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                        return null;
                      })}
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center">
                <Link href="/docs/reports" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors">← Отчёты и экспорт</Link>
                <Link href="/api-docs" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">Полная справка API →</Link>
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
