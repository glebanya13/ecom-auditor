import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRightIcon, ZapIcon , LogoIcon } from '../components/Icons';

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

const FAQ_DATA = [
  {
    category: 'Общие вопросы',
    items: [
      {
        q: 'Что такое E-Com Auditor?',
        a: 'E-Com Auditor — это автоматический сервис для проверки товаров на маркетплейсах (Wildberries, Ozon). Он анализирует соответствие законодательству РФ, финансовую рентабельность и SEO-позиции.',
      },
      {
        q: 'Какие маркетплейсы поддерживаются?',
        a: 'В настоящее время поддерживаются Wildberries и Ozon. Поддержка Яндекс.Маркет и других платформ запланирована в следующих обновлениях.',
      },
      {
        q: 'Нужна ли регистрация для быстрой проверки?',
        a: 'Нет. Быструю проверку (базовый скоринг) можно выполнить без регистрации прямо на главной странице. Для получения полного отчёта требуется аккаунт.',
      },
      {
        q: 'Насколько точны результаты проверки?',
        a: 'Точность системы составляет 98%. Мы используем официальные базы данных Росаккредитации, ФГИС Честный Знак и актуальные реестры нормативных актов. Базы обновляются ежедневно.',
      },
      {
        q: 'Как быстро выполняется проверка?',
        a: 'Быстрая проверка занимает около 30 секунд. Полный аудит с детальным отчётом — от 1 до 5 минут в зависимости от сложности товара.',
      },
    ],
  },
  {
    category: 'Оплата и тарифы',
    items: [
      {
        q: 'Что входит в бесплатный тариф Freemium?',
        a: '3 проверки в день, базовый скоринг и список найденных проблем. Без PDF отчётов, Telegram бота и мониторинга.',
      },
      {
        q: 'Можно ли отменить Pro подписку?',
        a: 'Да, подписку можно отменить в любой момент в личном кабинете. Доступ сохраняется до конца оплаченного периода. Возврат средств производится пропорционально неиспользованному времени.',
      },
      {
        q: 'Есть ли пробный период для Pro тарифа?',
        a: 'Да, первые 7 дней Pro бесплатны. Привязывать карту для активации пробного периода не нужно.',
      },
      {
        q: 'Какие способы оплаты принимаются?',
        a: 'Банковские карты (Visa, Mastercard, МИР), Система быстрых платежей (СБП) и банковский перевод для юридических лиц с выставлением счёта.',
      },
      {
        q: 'Есть ли скидка при оплате на год?',
        a: 'Да, при годовой оплате скидка составляет 24%. Итоговая стоимость Pro тарифа — 1 900 ₽/месяц вместо 2 500 ₽.',
      },
    ],
  },
  {
    category: 'Технические вопросы',
    items: [
      {
        q: 'Что такое шадоубан и как E-Com Auditor его обнаруживает?',
        a: 'Шадоубан — это скрытое понижение видимости товара в поиске маркетплейса без явного уведомления продавца. Наш детектор анализирует динамику позиций, показы и поведенческие факторы для выявления признаков алгоритмической блокировки.',
      },
      {
        q: 'Как происходит расчёт НДС 22%?',
        a: 'С 1 января 2026 года ставка НДС для большинства товаров увеличилась с 20% до 22%. E-Com Auditor автоматически применяет актуальные ставки при расчёте себестоимости и маржинальности.',
      },
      {
        q: 'Могу ли я проверить сразу несколько товаров?',
        a: 'Да, функция массовой проверки доступна в тарифах Pro и Enterprise. Вы можете загрузить список SKU в CSV формате и получить отчёты по всем товарам одновременно.',
      },
      {
        q: 'Как настроить Telegram уведомления?',
        a: 'В личном кабинете перейдите в Настройки → Уведомления → Telegram. Следуйте инструкциям по подключению бота. Функция доступна начиная с тарифа Pro.',
      },
      {
        q: 'Как получить API ключ для интеграции?',
        a: 'API доступ предоставляется в тарифе Enterprise. Для получения ключа перейдите в Настройки → API ключи. Документация API доступна на странице /api-docs.',
      },
      {
        q: 'Где хранятся мои данные?',
        a: 'Все данные хранятся на серверах в России в соответствии с требованиями ФЗ-152. Данные шифруются при передаче (TLS 1.3) и хранении (AES-256).',
      },
    ],
  },
];

export default function Faq() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Head>
        <title>FAQ — E-Com Auditor</title>
        <meta name="description" content="Ответы на частые вопросы о E-Com Auditor: проверки, тарифы, оплата, технические вопросы." />
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
            <ZapIcon size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Часто задаваемые вопросы</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            Ответы на<br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              ваши вопросы
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Собрали ответы на самые частые вопросы о E-Com Auditor
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          {FAQ_DATA.map((category) => (
            <div key={category.category} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-100">{category.category}</h2>
              <div className="space-y-3">
                {category.items.map((item, j) => {
                  const key = `${category.category}-${j}`;
                  const isOpen = openItems[key];
                  return (
                    <div key={j} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between p-6 text-left"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                        <span className={`text-blue-600 text-2xl font-light transition-transform flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Still have questions */}
          <div className="mt-8 p-8 bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-200 rounded-2xl text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Не нашли ответ?</h3>
            <p className="text-gray-600 mb-6">Напишите нам — ответим в течение 24 часов</p>
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
