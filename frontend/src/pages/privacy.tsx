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
      'Настоящая Политика конфиденциальности регулирует обработку персональных данных пользователей сервиса E-Com Auditor (далее — «Сервис»), доступного по адресу ecomauditor.ru.',
      'Оператором персональных данных является ООО «Е-Ком Одитор», зарегистрированное в соответствии с законодательством Российской Федерации.',
      'Используя Сервис, вы соглашаетесь с условиями настоящей Политики. Если вы не согласны с Политикой, пожалуйста, прекратите использование Сервиса.',
      'Обработка персональных данных осуществляется в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».',
    ],
  },
  {
    id: 'data',
    title: '2. Собираемые данные',
    content: [
      'При регистрации: имя, адрес электронной почты, номер телефона (по желанию), данные для выставления счетов (для платных тарифов).',
      'При использовании Сервиса: SKU проверяемых товаров, история аудитов, настройки мониторинга, IP-адрес, тип браузера и устройства.',
      'Файлы cookie: технические cookie для работы сервиса, аналитические cookie для улучшения продукта (с вашего согласия).',
      'Мы не собираем и не обрабатываем специальные категории персональных данных (медицинские, биометрические и т.п.).',
    ],
  },
  {
    id: 'usage',
    title: '3. Использование данных',
    content: [
      'Предоставление услуг Сервиса: выполнение проверок, хранение истории аудитов, формирование отчётов.',
      'Улучшение качества Сервиса: анализ паттернов использования, выявление ошибок, разработка новых функций.',
      'Коммуникация: отправка уведомлений о результатах мониторинга, обновлениях, технических работах.',
      'Выставление счетов и обработка платежей: формирование инвойсов, учёт оплат.',
      'Мы не продаём, не передаём и не сдаём в аренду ваши персональные данные третьим лицам в маркетинговых целях.',
    ],
  },
  {
    id: 'storage',
    title: '4. Хранение и безопасность',
    content: [
      'Все данные хранятся на серверах, расположенных на территории Российской Федерации, в соответствии с требованиями ФЗ-152.',
      'Передача данных осуществляется с использованием протокола TLS 1.3. Данные хранятся в зашифрованном виде (AES-256).',
      'Доступ к персональным данным ограничен и предоставляется только сотрудникам, которым он необходим для выполнения служебных обязанностей.',
      'Срок хранения данных: данные аккаунта хранятся до его удаления + 30 дней. Данные о транзакциях — 5 лет (в соответствии с требованиями налогового законодательства).',
    ],
  },
  {
    id: 'cookies',
    title: '5. Файлы cookie',
    content: [
      'Технические cookie (обязательные): необходимы для работы Сервиса. Включают сессионные токены, CSRF-защиту, настройки интерфейса.',
      'Аналитические cookie: используем анализ для понимания, как пользователи взаимодействуют с Сервисом. Эти cookie активируются только с вашего явного согласия.',
      'Вы можете управлять cookie через настройки браузера. Отключение обязательных cookie может нарушить работу Сервиса.',
    ],
  },
  {
    id: 'rights',
    title: '6. Ваши права',
    content: [
      'Право на доступ: вы можете запросить информацию о том, какие данные мы храним о вас.',
      'Право на исправление: вы можете обновить или исправить ваши данные в личном кабинете или по запросу.',
      'Право на удаление: вы можете запросить удаление вашего аккаунта и всех связанных данных.',
      'Право на ограничение обработки: вы можете ограничить обработку ваших данных в определённых случаях.',
      'Право на возражение: вы можете возражать против обработки ваших данных для маркетинговых целей.',
      'Для реализации прав обратитесь на privacy@ecomauditor.ru. Запрос будет обработан в течение 30 дней.',
    ],
  },
  {
    id: 'third-parties',
    title: '7. Третьи стороны',
    content: [
      'Платёжные системы: для обработки платежей используются сертифицированные платёжные провайдеры. Данные карт нами не хранятся.',
      'Аналитика: при наличии вашего согласия данные об использовании Сервиса передаются в обезличенном виде.',
      'Маркетплейсы: при проверке товаров мы делаем запросы к публичным API Wildberries и Ozon. Ваши персональные данные при этом не передаются.',
    ],
  },
  {
    id: 'changes',
    title: '8. Изменения политики',
    content: [
      'Мы можем обновлять настоящую Политику. О существенных изменениях мы уведомим вас по электронной почте или через уведомление в Сервисе.',
      'Продолжение использования Сервиса после вступления изменений в силу означает ваше согласие с новой редакцией Политики.',
      'Дата последнего обновления: 1 февраля 2026 года.',
    ],
  },
  {
    id: 'contacts',
    title: '9. Контакты',
    content: [
      'По вопросам обработки персональных данных обращайтесь: privacy@ecomauditor.ru',
      'Ответственный за обработку персональных данных: Соколова Мария Александровна',
      'Адрес: 125009, г. Москва, ул. Тверская, д. 1 (для почтовых обращений)',
    ],
  },
];

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Политика конфиденциальности — E-Com Auditor</title>
        <meta name="description" content="Политика конфиденциальности E-Com Auditor. Как мы собираем, используем и защищаем ваши персональные данные." />
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
            Политика конфиденциальности
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

              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                <p className="text-blue-800 text-sm leading-relaxed">
                  Если у вас есть вопросы по настоящей Политике конфиденциальности, свяжитесь с нами по адресу{' '}
                  <strong>privacy@ecomauditor.ru</strong> или через форму на{' '}
                  <Link href="/contact" className="underline hover:no-underline">странице контактов</Link>.
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
