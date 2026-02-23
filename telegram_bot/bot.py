"""
Telegram Bot — E-Com Auditor 2026
Pulls live data from the backend API (no direct DB access).

Env vars:
  TELEGRAM_BOT_TOKEN  — bot token from @BotFather
  BOT_API_URL         — backend base URL (default: http://backend:8000)
  BOT_SECRET          — shared secret for /api/v1/bot/* endpoints
  WEB_URL             — public frontend URL for links in messages
"""
import logging
import os
from datetime import datetime

import httpx
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

# ── Config ────────────────────────────────────────────────────────────────────

TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
API_URL = os.environ.get("BOT_API_URL", "http://backend:8000")
BOT_SECRET = os.environ.get("BOT_SECRET", "")
WEB_URL = os.environ.get("WEB_URL", "http://31.59.139.73")

_HEADERS = {"X-Bot-Secret": BOT_SECRET}

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


# ── Backend API client ────────────────────────────────────────────────────────

async def _api(method: str, path: str, **kwargs):
    """Make a request to the backend bot API. Returns parsed JSON or None."""
    url = f"{API_URL}/api/v1/bot{path}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await getattr(client, method)(url, headers=_HEADERS, **kwargs)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        logger.warning("API %s %s → %s", method.upper(), path, exc)
        return None


async def get_user(tid: str):
    return await _api("get", "/user", params={"telegram_id": tid})


async def get_products(tid: str):
    return await _api("get", "/products", params={"telegram_id": tid})


async def get_report(tid: str):
    return await _api("get", "/report", params={"telegram_id": tid})


# ── Helpers ───────────────────────────────────────────────────────────────────

def _risk_icon(p: dict) -> str:
    score = p.get("last_score")
    critical = p.get("shadow_ban_detected") or p.get("certificate_expired") or p.get("marking_issues")
    if critical or (score is not None and score < 50):
        return "🔴"
    if score is None or score < 75:
        return "🟡"
    return "🟢"


def _mp_icon(mp: str) -> str:
    return "🟣 WB" if mp == "wildberries" else "🔵 Ozon"


def _not_linked(tid: str) -> tuple:
    """Message + keyboard for unlinked user."""
    text = (
        "🔗 <b>Аккаунт не привязан</b>\n\n"
        f"Ваш Telegram ID: <code>{tid}</code>\n\n"
        "Как привязать:\n"
        f"1. Войдите на <a href='{WEB_URL}/dashboard/settings'>сайт → Настройки</a>\n"
        "2. Введите этот ID в поле «Telegram ID»\n"
        "3. Нажмите «Сохранить» и напишите /start"
    )
    kb = InlineKeyboardMarkup(
        [[InlineKeyboardButton("⚙️ Открыть Настройки", url=f"{WEB_URL}/dashboard/settings")]]
    )
    return text, kb


# ── /start ────────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = str(update.effective_user.id)
    user = await get_user(tid)

    if not user:
        text, kb = _not_linked(tid)
        await update.message.reply_text(
            text, parse_mode="HTML", reply_markup=kb, disable_web_page_preview=True
        )
        return

    name = user.get("full_name") or user.get("email", "").split("@")[0]
    sub = "✅ Активна" if user.get("subscription_active") else "🆓 Бесплатный план"
    report = await get_report(tid) or {}
    total = report.get("total", 0)

    await update.message.reply_text(
        f"👋 <b>Привет, {name}!</b>\n\n"
        f"📦 Товаров под мониторингом: <b>{total}</b>\n"
        f"💳 Подписка: {sub}\n\n"
        "<b>Команды:</b>\n"
        "/report — сводка по всем товарам\n"
        "/products — список товаров\n"
        "/check_legal — проверка комплаенса\n"
        "/help — справка",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🌐 Открыть дашборд", url=f"{WEB_URL}/dashboard")],
        ]),
    )


# ── /help ─────────────────────────────────────────────────────────────────────

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📚 <b>Справка</b>\n\n"
        "/start — главный экран\n"
        "/report — сводка: сколько товаров 🟢🟡🔴\n"
        "/products — полный список товаров\n"
        "/check_legal — статус сертификатов и маркировки\n"
        "/settings — настройки аккаунта\n\n"
        "🔔 <b>Автоуведомления бота:</b>\n"
        "• Просроченный / приостановленный сертификат\n"
        "• Теневой бан (резкое падение позиций)\n"
        "• Проблемы с маркировкой (Честный Знак)\n"
        "• Превышение лимита УСН\n\n"
        f"🌐 {WEB_URL}",
        parse_mode="HTML",
        disable_web_page_preview=True,
    )


# ── /report ───────────────────────────────────────────────────────────────────

async def cmd_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = str(update.effective_user.id)
    user = await get_user(tid)
    if not user:
        text, kb = _not_linked(tid)
        await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb, disable_web_page_preview=True)
        return

    msg = await update.message.reply_text("⏳ Загружаю данные…")
    report = await get_report(tid)

    if not report:
        await msg.edit_text("❌ Не удалось получить данные. Попробуйте позже.")
        return

    total = report["total"]
    if total == 0:
        await msg.edit_text(
            "📦 <b>Товаров пока нет</b>\n\n"
            f"Добавьте или импортируйте товары в <a href='{WEB_URL}/dashboard'>дашборде</a>.",
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
        return

    green = report["green"]
    yellow = report["yellow"]
    red = report["red"]
    health = round((green / total) * 100)
    critical = report.get("critical", [])

    text = (
        f"📊 <b>Сводка</b> — {datetime.now().strftime('%d.%m %H:%M')}\n\n"
        f"📦 Товаров: <b>{total}</b>\n"
        f"🟢 {green}  🟡 {yellow}  🔴 {red}\n"
        f"Здоровье каталога: <b>{health}%</b>"
    )
    if critical:
        text += "\n\n⚠️ <b>Требуют внимания:</b>\n" + "\n".join(f"• {c}" for c in critical)
    if not user.get("subscription_active"):
        text += f"\n\n💳 <a href='{WEB_URL}/dashboard/settings'>Подписка</a> — мониторинг 24/7"

    await msg.edit_text(
        text,
        parse_mode="HTML",
        disable_web_page_preview=True,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("📋 Список товаров", callback_data="cb_products")],
            [InlineKeyboardButton("🌐 Дашборд", url=f"{WEB_URL}/dashboard")],
        ]),
    )


# ── /products ─────────────────────────────────────────────────────────────────

async def cmd_products(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _send_products(update.message, str(update.effective_user.id))


async def _send_products(msg_obj, tid: str):
    user = await get_user(tid)
    if not user:
        text, kb = _not_linked(tid)
        await msg_obj.reply_text(text, parse_mode="HTML", reply_markup=kb, disable_web_page_preview=True)
        return

    products = await get_products(tid)
    if products is None:
        await msg_obj.reply_text("❌ Ошибка при получении данных.")
        return

    if not products:
        await msg_obj.reply_text(
            f"📦 Товаров нет. <a href='{WEB_URL}/dashboard'>Добавьте через дашборд</a>.",
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
        return

    lines = [f"📦 <b>Товары ({len(products)})</b>\n"]
    for p in products[:15]:
        icon = _risk_icon(p)
        mp = _mp_icon(p.get("marketplace", ""))
        name = (p.get("name") or p.get("sku_id") or "—")[:28]
        score_str = f" {int(p['last_score'])}/100" if p.get("last_score") is not None else ""
        price_str = f" · {int(p['current_price'])} ₽" if p.get("current_price") else ""
        lines.append(f"{icon} {mp} {name}{score_str}{price_str}")

    if len(products) > 15:
        lines.append(f"\n<i>ещё {len(products) - 15} товаров на сайте</i>")

    await msg_obj.reply_text(
        "\n".join(lines),
        parse_mode="HTML",
        disable_web_page_preview=True,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🌐 Открыть все товары", url=f"{WEB_URL}/dashboard/products")],
        ]),
    )


# ── /check_legal ──────────────────────────────────────────────────────────────

async def cmd_check_legal(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = str(update.effective_user.id)
    user = await get_user(tid)
    if not user:
        text, kb = _not_linked(tid)
        await update.message.reply_text(text, parse_mode="HTML", reply_markup=kb, disable_web_page_preview=True)
        return

    msg = await update.message.reply_text("⏳ Проверяю юридический статус…")
    products = await get_products(tid)

    if products is None:
        await msg.edit_text("❌ Ошибка при получении данных.")
        return

    if not products:
        await msg.edit_text(
            f"📦 Нет товаров для проверки.\n<a href='{WEB_URL}/dashboard'>Добавьте товары</a>.",
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
        return

    total = len(products)
    cert_bad = sum(1 for p in products if p.get("certificate_expired"))
    marking_bad = sum(1 for p in products if p.get("marking_issues"))
    shadow_ban = sum(1 for p in products if p.get("shadow_ban_detected"))
    cert_ok = total - cert_bad
    marking_ok = total - marking_bad

    score = round(((cert_ok + marking_ok) / (total * 2)) * 100)

    text = (
        "⚖️ <b>Юридический комплаенс</b>\n\n"
        "<b>Сертификаты (Росаккредитация):</b>\n"
        f"  ✅ Действительны: {cert_ok}\n"
        f"  ❌ Проблемы: {cert_bad}\n\n"
        "<b>Маркировка (Честный Знак):</b>\n"
        f"  ✅ Без проблем: {marking_ok}\n"
        f"  ⚠️ Нарушения: {marking_bad}\n"
    )
    if shadow_ban:
        text += f"\n🚫 Теневой бан: {shadow_ban} товар(а)\n"

    text += f"\n<b>Готовность к ФНС: {score}/100</b>"

    # Show problem list (max 5)
    problems = [p for p in products if p.get("certificate_expired") or p.get("marking_issues") or p.get("shadow_ban_detected")]
    if problems:
        text += "\n\n<b>Проблемные товары:</b>"
        for p in problems[:5]:
            issues = []
            if p.get("certificate_expired"):
                issues.append("сертификат ❌")
            if p.get("marking_issues"):
                issues.append("маркировка ⚠️")
            if p.get("shadow_ban_detected"):
                issues.append("теневой бан 🚫")
            label = (p.get("name") or p.get("sku_id") or "—")[:25]
            text += f"\n• {label} — {', '.join(issues)}"

    await msg.edit_text(
        text,
        parse_mode="HTML",
        disable_web_page_preview=True,
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("📋 Перейти к товарам", url=f"{WEB_URL}/dashboard/products")],
        ]),
    )


# ── /settings ─────────────────────────────────────────────────────────────────

async def cmd_settings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    tid = str(update.effective_user.id)
    user = await get_user(tid)
    sub = "✅ Активна" if (user and user.get("subscription_active")) else "🆓 Бесплатный план"

    await update.message.reply_text(
        "⚙️ <b>Настройки</b>\n\n"
        f"Telegram ID: <code>{tid}</code>\n"
        f"Подписка: {sub}\n\n"
        "Управление API ключами, профилем и подпиской — на сайте.",
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("⚙️ Открыть Настройки", url=f"{WEB_URL}/dashboard/settings")],
        ]),
    )


# ── Callback buttons ──────────────────────────────────────────────────────────

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    tid = str(query.from_user.id)

    if query.data == "cb_products":
        await _send_products(query.message, tid)


# ── Unknown command ───────────────────────────────────────────────────────────

async def cmd_unknown(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Неизвестная команда. /help — список команд.")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", cmd_start))
    application.add_handler(CommandHandler("help", cmd_help))
    application.add_handler(CommandHandler("report", cmd_report))
    application.add_handler(CommandHandler("products", cmd_products))
    application.add_handler(CommandHandler("check_legal", cmd_check_legal))
    application.add_handler(CommandHandler("settings", cmd_settings))
    application.add_handler(CallbackQueryHandler(handle_callback))
    application.add_handler(MessageHandler(filters.COMMAND, cmd_unknown))

    logger.info("Bot started (polling)…")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
