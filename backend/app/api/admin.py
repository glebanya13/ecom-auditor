"""
Admin API endpoints — user management, tickets & payments (Robokassa)
"""
import hashlib
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.database import get_db
from ..core.security import get_password_hash
from ..models.user import User
from ..models.ticket import Ticket, TicketStatus, TicketPriority
from .auth import get_current_user

# Two routers:
#   router         → /api/v1/admin/...   (admin-only)
#   payments_router → /api/v1/payments/... (authenticated users)
router = APIRouter()
payments_router = APIRouter()


# ---------------------------------------------------------------------------
# Admin guard
# ---------------------------------------------------------------------------

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Allow access only to users with is_verified=True (acts as admin flag)."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class UserAdminResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    balance: float
    subscription_active: bool
    subscription_expires_at: Optional[datetime]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    telegram_id: Optional[str]
    ozon_client_id: Optional[str]

    class Config:
        from_attributes = True


class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    balance: Optional[float] = None
    subscription_active: Optional[bool] = None
    subscription_expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    telegram_id: Optional[str] = None


class BalanceTopupRequest(BaseModel):
    user_id: int
    amount: float
    comment: Optional[str] = "Пополнение администратором"


class RobokassaInitRequest(BaseModel):
    amount: float
    description: str = "Пополнение баланса E-Com Auditor"


class RobokassaInitResponse(BaseModel):
    payment_url: str
    invoice_id: int


# ---------------------------------------------------------------------------
# Admin — Users CRUD
# ---------------------------------------------------------------------------

@router.get("/users", response_model=List[UserAdminResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List all users (paginated)."""
    users = db.query(User).order_by(User.id).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=UserAdminResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get single user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserAdminResponse)
async def update_user(
    user_id: int,
    data: UserAdminUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Update any user field (admin)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_fields = data.dict(exclude_unset=True)

    # Hash password if provided
    if "password" in update_fields:
        raw = update_fields.pop("password")
        if raw:
            user.hashed_password = get_password_hash(raw)

    for field, value in update_fields.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Admin — Manual balance top-up
# ---------------------------------------------------------------------------

@router.post("/balance/topup", response_model=UserAdminResponse)
async def topup_balance(
    data: BalanceTopupRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Manually add/subtract balance (admin action). Amount can be negative."""
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.balance = round((user.balance or 0.0) + data.amount, 2)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Admin — Stats overview
# ---------------------------------------------------------------------------

@router.get("/stats")
async def get_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """System overview statistics."""
    from ..models.product import Product
    from ..models.audit_log import AuditLog

    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    pro_users = db.query(func.count(User.id)).filter(User.subscription_active == True).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_audits = db.query(func.count(AuditLog.id)).scalar() or 0
    open_tickets = db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.open).scalar() or 0
    total_balance = db.query(func.sum(User.balance)).scalar() or 0.0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "pro_users": pro_users,
        "total_products": total_products,
        "total_audits": total_audits,
        "open_tickets": open_tickets,
        "total_balance": round(float(total_balance), 2),
    }


# ---------------------------------------------------------------------------
# Tickets — schemas
# ---------------------------------------------------------------------------

class TicketCreate(BaseModel):
    subject: str
    description: str
    category: str = "bug"   # bug | feature | payment | other
    priority: str = "medium"
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    user_id: Optional[int]
    subject: str
    description: str
    category: str
    status: str
    priority: str
    admin_response: Optional[str]
    contact_email: Optional[str]
    contact_name: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]
    # user info (denormalized)
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


class TicketListResponse(BaseModel):
    items: List[TicketResponse]
    total: int


class TicketAdminUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    admin_response: Optional[str] = None


# ---------------------------------------------------------------------------
# Tickets — user endpoints (create + view own)
# ---------------------------------------------------------------------------

@router.post("/tickets", response_model=TicketResponse, status_code=201)
async def create_ticket(
    data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a support/bug ticket (any authenticated user)."""
    ticket = Ticket(
        user_id=current_user.id,
        subject=data.subject.strip(),
        description=data.description.strip(),
        category=data.category,
        priority=data.priority,
        contact_email=data.contact_email or current_user.email,
        contact_name=data.contact_name or current_user.full_name,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    resp = TicketResponse.from_orm(ticket)
    resp.user_email = current_user.email
    resp.user_name = current_user.full_name
    return resp


@router.get("/tickets/my", response_model=TicketListResponse)
async def my_tickets(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's own tickets."""
    q = db.query(Ticket).filter(Ticket.user_id == current_user.id)
    total = q.count()
    items = q.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for t in items:
        r = TicketResponse.from_orm(t)
        r.user_email = current_user.email
        r.user_name = current_user.full_name
        result.append(r)
    return TicketListResponse(items=result, total=total)


# ---------------------------------------------------------------------------
# Tickets — admin endpoints
# ---------------------------------------------------------------------------

@router.get("/tickets", response_model=TicketListResponse)
async def list_tickets(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """List all tickets with optional filters (admin)."""
    q = db.query(Ticket)
    if status:
        q = q.filter(Ticket.status == status)
    if priority:
        q = q.filter(Ticket.priority == priority)
    total = q.count()
    items = q.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for t in items:
        r = TicketResponse.from_orm(t)
        if t.user:
            r.user_email = t.user.email
            r.user_name = t.user.full_name
        result.append(r)
    return TicketListResponse(items=result, total=total)


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    r = TicketResponse.from_orm(ticket)
    if ticket.user:
        r.user_email = ticket.user.email
        r.user_name = ticket.user.full_name
    return r


@router.patch("/tickets/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    data: TicketAdminUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update ticket status, priority, or add admin response."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if data.status is not None:
        ticket.status = data.status
        if data.status in ("resolved", "closed"):
            ticket.resolved_at = datetime.utcnow()
            ticket.resolved_by_id = admin.id
    if data.priority is not None:
        ticket.priority = data.priority
    if data.admin_response is not None:
        ticket.admin_response = data.admin_response
        if ticket.status == TicketStatus.open:
            ticket.status = TicketStatus.in_progress

    db.commit()
    db.refresh(ticket)
    r = TicketResponse.from_orm(ticket)
    if ticket.user:
        r.user_email = ticket.user.email
        r.user_name = ticket.user.full_name
    return r


# ---------------------------------------------------------------------------
# Robokassa — payment init (self-service, any authenticated user)
# ---------------------------------------------------------------------------
#
# Flow:
#   1. POST /api/v1/payments/init  → получаем payment_url
#   2. Редиректим юзера на Robokassa
#   3. Robokassa POST → /api/v1/payments/robokassa/result  (webhook)
#   4. Бэкенд проверяет подпись, зачисляет баланс, отвечает "OK{InvId}"
#
# .env переменные:
#   ROBOKASSA_MERCHANT_LOGIN=...
#   ROBOKASSA_PASSWORD1=...   (для генерации ссылок)
#   ROBOKASSA_PASSWORD2=...   (для проверки webhook)
#   ROBOKASSA_TEST_MODE=true  (тестовый режим)
# ---------------------------------------------------------------------------

_ROBOKASSA_URL = "https://auth.robokassa.ru/Merchant/Index.aspx"


def _sign_init(merchant: str, pw1: str, amount: float, inv_id: int, shp: str) -> str:
    """Signature for payment init: MD5(Merchant:Amount:InvId:shp_param:Password1)"""
    raw = f"{merchant}:{amount:.2f}:{inv_id}:{shp}:{pw1}"
    return hashlib.md5(raw.encode()).hexdigest()


def _sign_result(pw2: str, amount: float, inv_id: int, shp: str) -> str:
    """Signature for result callback: MD5(Amount:InvId:Password2:shp_param)"""
    raw = f"{amount:.2f}:{inv_id}:{pw2}:{shp}"
    return hashlib.md5(raw.encode()).hexdigest()


@payments_router.post("/payments/init", response_model=RobokassaInitResponse)
async def init_payment(
    data: RobokassaInitRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate Robokassa payment URL for balance top-up."""
    merchant = settings.ROBOKASSA_MERCHANT_LOGIN
    pw1 = settings.ROBOKASSA_PASSWORD1
    test = settings.ROBOKASSA_TEST_MODE.lower() == "true"

    if not merchant or not pw1:
        raise HTTPException(
            status_code=503,
            detail="Платёжная система не настроена. Обратитесь к администратору."
        )

    if data.amount < 100:
        raise HTTPException(status_code=400, detail="Минимальная сумма пополнения — 100 ₽")

    # Уникальный InvId: последние 9 цифр от user_id + timestamp
    inv_id = int(f"{current_user.id}{int(datetime.utcnow().timestamp())}"[-9:])
    shp = f"shp_user_id={current_user.id}"

    sig = _sign_init(merchant, pw1, data.amount, inv_id, shp)

    params = "&".join([
        f"MerchantLogin={merchant}",
        f"OutSum={data.amount:.2f}",
        f"InvId={inv_id}",
        f"Description={data.description}",
        f"SignatureValue={sig}",
        shp,
        f"IsTest={1 if test else 0}",
    ])

    return RobokassaInitResponse(
        payment_url=f"{_ROBOKASSA_URL}?{params}",
        invoice_id=inv_id,
    )


@payments_router.post("/payments/robokassa/result", response_class=PlainTextResponse)
async def robokassa_result(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Webhook от Robokassa после успешной оплаты.
    Вызывается серверами Robokassa — без авторизации.
    Отвечаем "OK{InvId}" при успехе.
    """
    pw2 = settings.ROBOKASSA_PASSWORD2
    if not pw2:
        raise HTTPException(status_code=503, detail="Payment system not configured")

    form = await request.form()
    out_sum = form.get("OutSum", "")
    inv_id_raw = form.get("InvId", "")
    sig_received = form.get("SignatureValue", "")
    shp_user_id = form.get("shp_user_id", "")

    try:
        amount = float(out_sum)
        inv_id = int(inv_id_raw)
        user_id = int(shp_user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid parameters")

    shp = f"shp_user_id={user_id}"
    expected = _sign_result(pw2, amount, inv_id, shp)

    if expected.lower() != sig_received.lower():
        raise HTTPException(status_code=400, detail="Invalid signature")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.balance = round((user.balance or 0.0) + amount, 2)
    db.commit()

    return f"OK{inv_id}"


@payments_router.get("/payments/robokassa/success")
async def robokassa_success():
    """Страница успешной оплаты (редирект от Robokassa). Фронтенд обрабатывает сам."""
    return {"status": "ok", "message": "Оплата прошла успешно. Баланс пополнен."}


@payments_router.get("/payments/robokassa/fail")
async def robokassa_fail():
    """Страница неудачной оплаты."""
    return {"status": "fail", "message": "Оплата не завершена."}
