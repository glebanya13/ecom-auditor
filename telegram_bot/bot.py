"""
Telegram Bot for E-Com Auditor 2026
Commands: /report, /check_legal, /products, /help
"""
import asyncio
import logging
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters
)
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.core.config import settings

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


class EComAuditorBot:
    """E-Com Auditor Telegram Bot"""

    def __init__(self, token: str):
        self.token = token
        self.application = Application.builder().token(token).build()
        self._setup_handlers()

    def _setup_handlers(self):
        """Setup command and message handlers"""

        # Commands
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("report", self.report_command))
        self.application.add_handler(CommandHandler("check_legal", self.check_legal_command))
        self.application.add_handler(CommandHandler("products", self.products_command))
        self.application.add_handler(CommandHandler("settings", self.settings_command))

        # Callback handlers
        self.application.add_handler(CallbackQueryHandler(self.handle_callback))

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""

        welcome_message = """
🚀 <b>Добро пожаловать в E-Com Auditor 2026!</b>

Система комплексного аудита для селлеров на маркетплейсах.

<b>Основные возможности:</b>
✅ Проверка юридического комплаенса (ФЗ-289)
✅ Аудит ранжирования и SEO
✅ Финансовый анализ с НДС 22%
✅ Генерация юридических документов
✅ Мониторинг 24/7

<b>Команды:</b>
/report - Отчет по прибыли за день
/check_legal - Проверка готовности к ФНС
/products - Список ваших товаров
/settings - Настройки уведомлений
/help - Помощь

Для начала работы привяжите свой аккаунт через веб-интерфейс:
https://ecom-auditor.ru
"""

        await update.message.reply_text(
            welcome_message,
            parse_mode='HTML'
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""

        help_text = """
📚 <b>Справка по командам</b>

<b>/report</b> - Мгновенный отчет по прибыли
Показывает:
• Выручка за день
• Чистая прибыль с учетом НДС 22%
• Топ-3 товара
• Проблемные позиции

<b>/check_legal</b> - Проверка документов
Проверяет:
• Актуальность сертификатов
• Соответствие маркировки
• Готовность к проверке ФНС

<b>/products</b> - Список товаров
Отображает все отслеживаемые товары с индикацией рисков:
🟢 Зеленый - всё хорошо
🟡 Желтый - требует внимания
🔴 Красный - критические проблемы

<b>/settings</b> - Настройки
Управление уведомлениями и алертами

<b>Автоматические уведомления:</b>
⚠️ Приостановка сертификата
⚠️ Принудительная акция (требует решения)
⚠️ Резкое падение позиций
⚠️ Превышение лимита УСН

По вопросам: support@ecom-auditor.ru
"""

        await update.message.reply_text(help_text, parse_mode='HTML')

    async def report_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /report command - daily profit report"""

        # Mock data - in production, fetch from API
        report = """
📊 <b>Отчет за сегодня</b> ({date})

💰 <b>Финансы:</b>
Выручка: 145,600 ₽
Расходы: 98,340 ₽
НДС 22%: 26,384 ₽
<b>Чистая прибыль: 20,876 ₽</b>

📦 <b>Топ-3 товара:</b>
1. SKU-12345 | 12,400 ₽
2. SKU-67890 | 8,200 ₽
3. SKU-11111 | 6,100 ₽

⚠️ <b>Проблемы:</b>
• SKU-54321: Падение позиций (-15)
• SKU-99999: Низкий рейтинг (4.2)

Полный отчет в PDF:
[Скачать отчет]
""".format(date=datetime.now().strftime("%d.%m.%Y"))

        keyboard = [
            [InlineKeyboardButton("📥 Скачать PDF", callback_data="download_report")],
            [InlineKeyboardButton("📈 Детальная аналитика", callback_data="detailed_analytics")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            report,
            parse_mode='HTML',
            reply_markup=reply_markup
        )

    async def check_legal_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /check_legal command - legal compliance check"""

        legal_check = """
⚖️ <b>Проверка юридического комплаенса</b>

<b>Сертификаты и декларации:</b>
✅ 12 товаров - сертификаты действительны
⚠️ 2 товара - истекает через 30 дней
❌ 1 товар - сертификат приостановлен

<b>Маркировка "Честный ЗНАК":</b>
✅ Соответствие остатков: 98%
⚠️ 15 кодов требуют проверки

<b>НДС и УСН:</b>
✅ Оборот в пределах лимита (78%)
Использовано: 206,844,000 из 265,800,000 ₽

<b>Готовность к проверке ФНС:</b>
🟢 Высокая (92/100)

<b>Рекомендации:</b>
1. Продлить сертификат SKU-54321
2. Обновить коды маркировки (список ↓)
3. Подготовить документы на случай проверки
"""

        keyboard = [
            [InlineKeyboardButton("📄 Список проблемных товаров", callback_data="problem_products")],
            [InlineKeyboardButton("📋 Сгенерировать документы", callback_data="generate_legal_docs")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            legal_check,
            parse_mode='HTML',
            reply_markup=reply_markup
        )

    async def products_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /products command - list products"""

        products_list = """
📦 <b>Ваши товары (15)</b>

🟢 SKU-12345 | Кроссовки Nike
   Оценка: 92/100 | Позиция: #8

🟢 SKU-67890 | Футболка Adidas
   Оценка: 88/100 | Позиция: #12

🟡 SKU-11111 | Рюкзак Puma
   Оценка: 67/100 | Позиция: #45
   ⚠️ Медленная доставка

🔴 SKU-54321 | Кепка Reebok
   Оценка: 42/100 | Позиция: #156
   ❌ Сертификат приостановлен
   ⚠️ Низкий рейтинг (4.1)

🟡 SKU-99999 | Носки Nike
   Оценка: 71/100 | Позиция: #32
   ⚠️ Проблемы с маркировкой

<i>+ еще 10 товаров</i>
"""

        keyboard = [
            [InlineKeyboardButton("🔍 Аудит всех товаров", callback_data="audit_all")],
            [InlineKeyboardButton("⚙️ Добавить товар", callback_data="add_product")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            products_list,
            parse_mode='HTML',
            reply_markup=reply_markup
        )

    async def settings_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /settings command"""

        settings_text = """
⚙️ <b>Настройки уведомлений</b>

<b>Текущие настройки:</b>

📊 Ежедневный отчет: ✅ Включен (9:00)
⚠️ Критические алерты: ✅ Включен
📉 Падение позиций: ✅ Включен (>20 позиций)
💰 Принудительные акции: ✅ Включен
📜 Изменения в оферте: ✅ Включен
🔔 Истечение сертификатов: ✅ Включен (за 30 дней)

<b>Частота проверок:</b>
Основная: каждые 6 часов
Быстрая: каждый час
"""

        keyboard = [
            [InlineKeyboardButton("📊 Изменить время отчета", callback_data="change_report_time")],
            [InlineKeyboardButton("🔕 Отключить уведомления", callback_data="disable_notifications")],
            [InlineKeyboardButton("⚙️ Расширенные настройки", callback_data="advanced_settings")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            settings_text,
            parse_mode='HTML',
            reply_markup=reply_markup
        )

    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle button callbacks"""

        query = update.callback_query
        await query.answer()

        callback_data = query.data

        if callback_data == "download_report":
            await query.message.reply_text(
                "📥 Генерирую PDF-отчет...\n\nОтчет будет отправлен через несколько секунд."
            )
            # In production: generate and send actual PDF

        elif callback_data == "detailed_analytics":
            await query.message.reply_text(
                "📈 Детальная аналитика доступна в веб-интерфейсе:\nhttps://ecom-auditor.ru/analytics"
            )

        elif callback_data == "problem_products":
            await query.message.reply_text(
                "📄 <b>Товары с проблемами:</b>\n\n"
                "1. SKU-54321 - Сертификат приостановлен\n"
                "2. SKU-99999 - Проблема с маркировкой\n"
                "3. SKU-77777 - Истекает сертификат (через 15 дней)",
                parse_mode='HTML'
            )

        elif callback_data == "generate_legal_docs":
            keyboard = [
                [InlineKeyboardButton("📝 Претензия по ФЗ-289", callback_data="complaint_289")],
                [InlineKeyboardButton("⚖️ Жалоба в ФАС", callback_data="fas_complaint")],
                [InlineKeyboardButton("📋 Ответ на требование ФНС", callback_data="fns_response")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.message.reply_text(
                "Выберите тип документа:",
                reply_markup=reply_markup
            )

        elif callback_data == "audit_all":
            await query.message.reply_text(
                "🔍 Запускаю полный аудит всех товаров...\n\n"
                "Это займет 2-3 минуты. Результаты будут отправлены в этот чат."
            )

        else:
            await query.message.reply_text(
                "Функция в разработке. Используйте веб-интерфейс для полного доступа."
            )

    async def send_alert(self, chat_id: int, alert_type: str, message: str):
        """Send alert notification to user"""

        alert_icons = {
            "certificate_suspended": "🚨",
            "position_drop": "📉",
            "forced_promo": "💸",
            "offer_change": "📜",
            "usn_limit": "⚠️"
        }

        icon = alert_icons.get(alert_type, "⚠️")
        alert_message = f"{icon} <b>ВАЖНОЕ УВЕДОМЛЕНИЕ</b>\n\n{message}"

        await self.application.bot.send_message(
            chat_id=chat_id,
            text=alert_message,
            parse_mode='HTML'
        )

    def run(self):
        """Start the bot"""
        logger.info("Starting E-Com Auditor Bot...")
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    bot = EComAuditorBot(settings.TELEGRAM_BOT_TOKEN)
    bot.run()
