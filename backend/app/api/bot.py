"""
Bot API — endpoints exclusively for the Telegram bot.

Authentication: X-Bot-Secret header must match settings.BOT_SECRET.
All responses are JSON; the bot formats them into Telegram messages.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.database import get_db
from ..models.audit_log import AuditLog
from ..models.product import Product
from ..models.user import User

router = APIRouter()


# ── Auth guard ────────────────────────────────────────────────────────────────

def _verify_secret(x_bot_secret: str = Header(...)):
    if not settings.BOT_SECRET or x_bot_secret != settings.BOT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid bot secret")


# ── Schemas ───────────────────────────────────────────────────────────────────

class BotUserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    subscription_active: bool

    class Config:
        from_attributes = True


class BotProductOut(BaseModel):
    id: int
    sku_id: str
    marketplace: str
    name: Optional[str] = None
    current_price: Optional[float] = None
    rating: Optional[float] = None
    last_score: Optional[float] = None
    shadow_ban_detected: Optional[int] = None
    certificate_expired: Optional[int] = None
    marking_issues: Optional[int] = None

    class Config:
        from_attributes = True


class BotReport(BaseModel):
    total: int
    green: int
    yellow: int
    red: int
    critical: List[str]
    subscription_active: bool


# ── Helpers ───────────────────────────────────────────────────────────────────

def _score_color(p: Product, score: Optional[float]) -> str:
    """Return 🟢 / 🟡 / 🔴 based on issues and score."""
    critical = p.shadow_ban_detected or p.certificate_expired or p.marking_issues
    if critical or (score is not None and score < 50):
        return "red"
    if score is None or score < 75:
        return "yellow"
    return "green"


def _last_score(product_id: int, db: Session) -> Optional[float]:
    log = (
        db.query(AuditLog)
        .filter(AuditLog.product_id == product_id)
        .order_by(desc(AuditLog.created_at))
        .first()
    )
    return log.total_score if log else None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/user", response_model=BotUserOut)
def get_user(
    telegram_id: str,
    _: None = Depends(_verify_secret),
    db: Session = Depends(get_db),
):
    """Return user linked to this Telegram ID (404 if not linked)."""
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="not_linked")
    return user


@router.get("/products", response_model=List[BotProductOut])
def get_products(
    telegram_id: str,
    _: None = Depends(_verify_secret),
    db: Session = Depends(get_db),
):
    """Return all products for the user, enriched with last audit score."""
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="not_linked")

    products = (
        db.query(Product)
        .filter(Product.user_id == user.id)
        .order_by(desc(Product.created_at))
        .limit(50)
        .all()
    )
    result = []
    for p in products:
        out = BotProductOut.from_orm(p)
        out.last_score = _last_score(p.id, db)
        result.append(out)
    return result


@router.get("/report", response_model=BotReport)
def get_report(
    telegram_id: str,
    _: None = Depends(_verify_secret),
    db: Session = Depends(get_db),
):
    """Return a health-summary report for the dashboard message."""
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="not_linked")

    products = db.query(Product).filter(Product.user_id == user.id).all()

    green = yellow = red = 0
    critical: List[str] = []

    for p in products:
        score = _last_score(p.id, db)
        color = _score_color(p, score)

        if color == "green":
            green += 1
        elif color == "yellow":
            yellow += 1
        else:
            red += 1
            label = p.name or p.sku_id
            if p.certificate_expired:
                critical.append(f"❌ {label} — сертификат просрочен")
            if p.shadow_ban_detected:
                critical.append(f"🚫 {label} — теневой бан")
            if p.marking_issues:
                critical.append(f"⚠️ {label} — проблема маркировки")
            if not any([p.certificate_expired, p.shadow_ban_detected, p.marking_issues]):
                critical.append(f"🔴 {label} — низкий скоринг ({int(score or 0)}/100)")

    return BotReport(
        total=len(products),
        green=green,
        yellow=yellow,
        red=red,
        critical=critical[:5],
        subscription_active=user.subscription_active,
    )
