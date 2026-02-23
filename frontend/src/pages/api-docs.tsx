import Head from 'next/head';
import Link from 'next/link';
import { ZapIcon, LockIcon, CheckIcon, ArrowRightIcon, DocumentIcon, ShieldIcon , LogoIcon } from '../components/Icons';

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

const ENDPOINTS = [
  { method: 'POST', path: '/api/v1/audit/quick', desc: 'Быстрая проверка SKU', auth: false },
  { method: 'POST', path: '/api/v1/audit/full', desc: 'Полный аудит товара', auth: true },
  { method: 'GET', path: '/api/v1/audit/{id}', desc: 'Получить результат аудита', auth: true },
  { method: 'GET', path: '/api/v1/products', desc: 'Список товаров аккаунта', auth: true },
  { method: 'POST', path: '/api/v1/products', desc: 'Добавить товар на мониторинг', auth: true },
  { method: 'DELETE', path: '/api/v1/products/{id}', desc: 'Удалить товар из мониторинга', auth: true },
  { method: 'GET', path: '/api/v1/reports', desc: 'Список отчётов', auth: true },
  { method: 'POST', path: '/api/v1/auth/token', desc: 'Получить токен доступа', auth: false },
];

export default function ApiDocs() {
  return (
    <>
      <Head>
        <title>API документация — E-Com Auditor</title>
        <meta name="description" content="REST API для интеграции E-Com Auditor в ваши системы. Эндпоинты, примеры запросов и авторизация." />
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
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-8">
                <ZapIcon size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">REST API v1</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                Интегрируйте<br />
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  аудит в свой продукт
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Полноценный REST API для автоматизации проверок, интеграции с вашими системами и создания собственных инструментов.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {['JSON формат ответов', 'Bearer-токен авторизация', 'Rate limiting: 100 rps', 'Версионирование API'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckIcon size={16} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-blue-500/25 transition-all">
                Получить API ключ
                <ArrowRightIcon size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            {/* Code example */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl blur-2xl opacity-15"></div>
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-400 text-xs ml-2 font-mono">POST /api/v1/audit/quick</span>
                </div>
                <pre className="p-6 text-sm font-mono overflow-x-auto text-gray-100 leading-relaxed">{`curl -X POST \\
  https://api.ecomauditor.ru/v1/audit/quick \\
  -H "Content-Type: application/json" \\
  -d '{
    "sku_id": "123456789",
    "marketplace": "wildberries"
  }'`}</pre>
                <div className="border-t border-gray-700 p-6">
                  <div className="text-xs text-gray-500 mb-2 font-mono">Response 200 OK</div>
                  <pre className="text-sm font-mono text-emerald-400 leading-relaxed">{`{
  "sku_id": "123456789",
  "score": 72,
  "issues_found": [
    "Отсутствует сертификат ЕАС"
  ],
  "message": "Требует внимания"
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldIcon size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Авторизация</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Все защищённые эндпоинты требуют Bearer-токен в заголовке. Токен можно получить в личном кабинете или через API.
              </p>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Зарегистрируйтесь', desc: 'Создайте аккаунт на E-Com Auditor' },
                  { step: '2', title: 'Получите токен', desc: 'В настройках профиля → API ключи' },
                  { step: '3', title: 'Используйте в запросах', desc: 'Добавьте заголовок Authorization: Bearer <token>' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">{s.step}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{s.title}</div>
                      <div className="text-gray-600 text-sm">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <span className="text-gray-400 text-xs font-mono">Пример с авторизацией</span>
                </div>
                <pre className="p-6 text-sm font-mono text-gray-100 leading-relaxed">{`curl -X GET \\
  https://api.ecomauditor.ru/v1/products \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints Table */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <DocumentIcon size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Список эндпоинтов</h2>
              <p className="text-gray-600">Base URL: <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">https://api.ecomauditor.ru</code></p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Метод</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Эндпоинт</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Описание</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Авторизация</th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((ep, i) => (
                    <tr key={i} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold font-mono ${
                          ep.method === 'GET' ? 'bg-emerald-100 text-emerald-700' :
                          ep.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>{ep.method}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-gray-700">{ep.path}</td>
                      <td className="py-4 px-6 text-gray-600 text-sm">{ep.desc}</td>
                      <td className="py-4 px-6">
                        {ep.auth ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                            <LockIcon size={12} /> Требуется
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                            <CheckIcon size={12} /> Публичный
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Rate limits */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">Лимиты запросов</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { plan: 'Freemium', rps: '5 req/min', daily: '50/день', color: 'border-gray-200' },
              { plan: 'Pro', rps: '60 req/min', daily: '10 000/день', color: 'border-blue-200 bg-blue-50' },
              { plan: 'Enterprise', rps: '600 req/min', daily: 'Безлимит', color: 'border-violet-200 bg-violet-50' },
            ].map((tier) => (
              <div key={tier.plan} className={`rounded-2xl border-2 p-6 ${tier.color}`}>
                <h3 className="font-bold text-gray-900 text-lg mb-4">{tier.plan}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Скорость</span>
                    <span className="font-semibold text-gray-900 font-mono">{tier.rps}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">В день</span>
                    <span className="font-semibold text-gray-900 font-mono">{tier.daily}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Начните интеграцию сегодня</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">Получите API ключ и протестируйте первые 50 запросов бесплатно</p>
          <Link href="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transition-all text-lg">
            Получить API ключ
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
