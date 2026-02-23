import { LogoIcon } from '../components/Icons';
import Head from 'next/head';
import Link from 'next/link';

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
    id: 'general',
    title: '1. Общие положения',
    content: [
      'Настоящие Условия использования (далее — «Условия») регулируют отношения между ООО «Е-Ком Одитор» (далее — «Компания») и пользователями сервиса E-Com Auditor (далее — «Сервис»).',
      'Сервис предоставляется по адресу ecomauditor.ru и через API. Используя Сервис, вы соглашаетесь с настоящими Условиями.',
      'Компания вправе в любое время изменять Условия, уведомив пользователей через электронную почту или уведомление в интерфейсе.',
      'Если вам менее 18 лет, использование Сервиса допускается только с согласия родителей или законных представителей.',
    ],
  },
  {
    id: 'account',
    title: '2. Регистрация и аккаунт',
    content: [
      'Для доступа к полному функционалу Сервиса необходимо создать аккаунт, предоставив корректные данные.',
      'Вы несёте ответственность за сохранность учётных данных и все действия, совершённые с вашего аккаунта.',
      'При утере доступа к аккаунту немедленно сообщите нам через форму восстановления или по адресу support@ecomauditor.ru.',
      'Компания вправе заблокировать аккаунт при обнаружении нарушений настоящих Условий без предварительного уведомления.',
    ],
  },
  {
    id: 'usage-rules',
    title: '3. Правила использования',
    content: [
      'Сервис предназначен исключительно для законной коммерческой деятельности на российских маркетплейсах.',
      'Запрещается: использование автоматических скриптов для массового парсинга без специального разрешения; передача доступа третьим лицам (кроме Enterprise); использование Сервиса для обхода законных требований маркетплейсов.',
      'Запрещается: попытки взлома, тестирование на уязвимости без письменного разрешения, обратная разработка (реверс-инжиниринг) алгоритмов Сервиса.',
      'Компания вправе устанавливать лимиты на количество запросов в соответствии с тарифным планом пользователя.',
    ],
  },
  {
    id: 'payment',
    title: '4. Оплата и тарифы',
    content: [
      'Стоимость тарифных планов указана на странице /pricing. Все цены включают НДС 22%.',
      'Оплата производится авансом — ежемесячно или ежегодно, в зависимости от выбранного периода.',
      'Подписка продлевается автоматически. О предстоящем продлении мы уведомляем за 3 дня по электронной почте.',
      'При отмене подписки доступ к платным функциям сохраняется до конца оплаченного периода. Возврат средств за неиспользованный период производится по заявке в течение 14 дней с момента оплаты.',
      'В случае технических сбоев, повлёкших невозможность использования Сервиса на срок более 24 часов, Компания компенсирует пропорциональный период подписки.',
    ],
  },
  {
    id: 'ip',
    title: '5. Интеллектуальная собственность',
    content: [
      'Все права на Сервис, включая алгоритмы, дизайн, контент и торговые марки, принадлежат ООО «Е-Ком Одитор».',
      'Пользователю предоставляется ограниченная, неисключительная, непередаваемая лицензия на использование Сервиса в рамках его функционала.',
      'Отчёты, сгенерированные Сервисом, могут использоваться пользователем в своей коммерческой деятельности. Перепродажа отчётов или их частей без согласия Компании запрещена.',
    ],
  },
  {
    id: 'liability',
    title: '6. Ответственность и ограничения',
    content: [
      'Сервис предоставляется «как есть». Компания не гарантирует абсолютную точность проверок — результаты носят информационный характер и не являются юридической консультацией.',
      'Компания не несёт ответственности за решения, принятые на основании результатов аудита, за действия маркетплейсов, за убытки, возникшие вследствие технических сбоев третьих сторон.',
      'Максимальная ответственность Компании перед пользователем ограничена суммой, уплаченной им за последние 3 месяца использования Сервиса.',
      'Пользователь несёт ответственность за соответствие своей деятельности действующему законодательству РФ.',
    ],
  },
  {
    id: 'termination',
    title: '7. Прекращение использования',
    content: [
      'Вы можете прекратить использование Сервиса в любой момент, удалив аккаунт в настройках личного кабинета.',
      'Компания вправе приостановить или прекратить доступ к Сервису при: нарушении настоящих Условий; неоплате в течение 14 дней после истечения подписки; обнаружении мошеннической деятельности.',
      'При закрытии аккаунта данные удаляются в соответствии с Политикой конфиденциальности.',
    ],
  },
  {
    id: 'disputes',
    title: '8. Разрешение споров',
    content: [
      'Настоящие Условия регулируются законодательством Российской Федерации.',
      'Споры между сторонами решаются путём переговоров. При невозможности урегулирования — в Арбитражном суде города Москвы.',
      'Претензии направляются по адресу legal@ecomauditor.ru. Компания рассматривает претензии в течение 30 рабочих дней.',
    ],
  },
  {
    id: 'contacts',
    title: '9. Контакты',
    content: [
      'ООО «Е-Ком Одитор»',
      'ОГРН: 1237700000000 (условный)',
      'ИНН: 7700000000 (условный)',
      'Адрес: 125009, г. Москва, ул. Тверская, д. 1',
      'Email: legal@ecomauditor.ru',
    ],
  },
];

export default function Terms() {
  return (
    <>
      <Head>
        <title>Условия использования — E-Com Auditor</title>
        <meta name="description" content="Условия использования сервиса E-Com Auditor. Правила, оплата, ответственность." />
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
      <section className="pt-32 pb-12 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            Условия использования
          </h1>
          <p className="text-gray-600">Последнее обновление: 1 февраля 2026 года</p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Table of contents */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Содержание</h3>
                <nav className="space-y-2">
                  {SECTIONS.map((s) => (
                    <a key={s.id} href={`#${s.id}`} className="block text-sm text-gray-600 hover:text-blue-600 transition-colors py-1 border-l-2 border-transparent hover:border-blue-600 pl-3">
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-3 space-y-10">
              {SECTIONS.map((s) => (
                <div key={s.id} id={s.id} className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{s.title}</h2>
                  <div className="space-y-3">
                    {s.content.map((para, i) => (
                      <p key={i} className="text-gray-600 leading-relaxed">{para}</p>
                    ))}
                  </div>
                </div>
              ))}

              <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                <p className="text-gray-700 text-sm leading-relaxed">
                  Настоящие Условия составлены в соответствии с законодательством РФ. По всем вопросам:&nbsp;
                  <strong>legal@ecomauditor.ru</strong>. Также см.{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">Политику конфиденциальности</Link>.
                </p>
              </div>
            </div>
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
