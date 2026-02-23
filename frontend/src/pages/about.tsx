import Head from 'next/head';
import Link from 'next/link';
import { ArrowRightIcon, ShieldIcon, TrendingIcon, ZapIcon, StarIcon, CheckIcon , LogoIcon } from '../components/Icons';

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

const TEAM = [
  { name: 'Алексей Морозов', role: 'CEO & Co-founder', desc: 'Экс-селлер с 8-летним опытом на WB и Ozon. Основал компанию после собственного опыта с блокировками.' },
  { name: 'Мария Соколова', role: 'CTO & Co-founder', desc: 'ML-инженер с опытом в NLP и анализе данных. Построила ядро системы скоринга.' },
  { name: 'Дмитрий Волков', role: 'Head of Legal', desc: 'Юрист по электронной торговле. Специализируется на ФЗ-289 и сертификации товаров.' },
  { name: 'Анна Лебедева', role: 'Head of Product', desc: 'Product manager с опытом в SaaS B2B. Формирует продуктовую стратегию и UX.' },
];

const MILESTONES = [
  { year: '2023', title: 'Основание компании', desc: 'Запуск первой версии сервиса для ручных проверок' },
  { year: '2024', title: 'Автоматизация', desc: 'ML-модель скоринга и интеграция с базами Росаккредитации' },
  { year: '2025', title: 'Масштабирование', desc: '2 500+ активных пользователей, запуск Enterprise тарифа' },
  { year: '2026', title: 'Сегодня', desc: 'НДС 22%, новые фичи, поддержка Яндекс.Маркет в разработке' },
];

export default function About() {
  return (
    <>
      <Head>
        <title>О нас — E-Com Auditor</title>
        <meta name="description" content="История и миссия E-Com Auditor. Команда, которая помогает селлерам маркетплейсов работать без рисков." />
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
            Мы помогаем селлерам<br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              работать без рисков
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            E-Com Auditor создан продавцами для продавцов. Мы сами прошли через блокировки, штрафы и проблемы с документацией — и построили инструмент, который защищает от этого других.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '2,500+', label: 'Активных селлеров', icon: StarIcon },
              { value: '15 000+', label: 'Проверок в день', icon: TrendingIcon },
              { value: '98%', label: 'Точность системы', icon: ShieldIcon },
              { value: '3 года', label: 'На рынке', icon: ZapIcon },
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

      {/* Mission */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Наша миссия</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Российский e-commerce растёт, но вместе с ним растёт и сложность: новые законы, изменения НДС, алгоритмы маркетплейсов. Небольшим продавцам сложно уследить за всем этим самостоятельно.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Мы автоматизируем рутинный контроль, чтобы продавцы могли сосредоточиться на развитии бизнеса, а не на бюрократии и разборе штрафов.
              </p>
              <ul className="space-y-4">
                {[
                  'Снижать юридические риски для продавцов',
                  'Делать финансовый анализ доступным каждому',
                  'Защищать от алгоритмических блокировок',
                  'Экономить время на ручных проверках',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckIcon size={20} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl blur-2xl opacity-10"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl p-10 text-white">
                <blockquote className="text-2xl font-semibold leading-relaxed mb-6">
                  "Мы потеряли 400 000 ₽ из-за блокировки товара, которую можно было предотвратить. Именно тогда и появилась идея E-Com Auditor."
                </blockquote>
                <div className="text-blue-200">— Алексей Морозов, CEO</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">История компании</h2>
            <p className="text-xl text-gray-600">От идеи до ведущего сервиса аудита маркетплейсов</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden lg:block"></div>
            <div className="space-y-12">
              {MILESTONES.map((m, i) => (
                <div key={i} className={`flex flex-col lg:flex-row items-start lg:items-center gap-8 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  <div className={`flex-1 ${i % 2 === 1 ? 'lg:text-right' : ''}`}>
                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all">
                      <div className="text-sm font-bold text-blue-600 mb-2">{m.year}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{m.title}</h3>
                      <p className="text-gray-600">{m.desc}</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full items-center justify-center flex-shrink-0 relative z-10 shadow-lg">
                    <span className="text-white font-bold text-sm">{i + 1}</span>
                  </div>
                  <div className="flex-1 hidden lg:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Команда</h2>
            <p className="text-xl text-gray-600">Эксперты в e-commerce, праве и технологиях</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM.map((member, i) => (
              <div key={i} className="group bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-blue-200 hover:shadow-xl transition-all text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xl">{member.name.charAt(0)}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
                <div className="text-sm text-blue-600 font-semibold mb-3">{member.role}</div>
                <p className="text-gray-600 text-sm leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Присоединяйтесь к 2 500+ селлерам</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">Начните защищать свой бизнес уже сегодня</p>
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
