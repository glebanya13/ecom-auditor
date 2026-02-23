"""
Legal documents API endpoints — Legal-блок платформы E-Com Auditor 2026.

Логика блока:
  1. Генерация досудебных претензий по ФЗ-289 с маппингом нарушения → статья закона
  2. Генерация жалоб в ФАС на антиконкурентные действия маркетплейсов
  3. Генерация уведомлений об изменении оферты
  4. Генерация документов для ФНС (НДС) и оспаривания возвратов
  5. Управление статусом документа: draft → sent → response_received
  6. Пагинация и фильтрация документов пользователя
  7. Генерация PDF по существующему документу

Валидация:
  - ИНН: 10 цифр (юрлицо) или 12 цифр (ИП/физлицо), проверка контрольных сумм
  - ОГРН: 13 цифр (юрлицо) или 15 цифр (ИП), проверка контрольной суммы
  - Дата нарушения: формат YYYY-MM-DD, не может быть в будущем
  - Маркетплейс: только wildberries | ozon | yandex_market | sber_megamarket
  - Сумма штрафа: >= 0
  - Тип нарушения: фиксированный список значений
"""
import re
import logging
from datetime import date, datetime
from typing import Optional, List, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, field_validator, model_validator

from ..core.database import get_db
from ..models.user import User
from ..models.legal_doc import LegalDoc
from ..services.legal_doc_generator import LegalDocGenerator
from .auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Константы
# ---------------------------------------------------------------------------

SUPPORTED_MARKETPLACES = Literal[
    "wildberries", "ozon", "yandex_market", "sber_megamarket"
]

MARKETPLACE_DISPLAY = {
    "wildberries": "Wildberries",
    "ozon": "Ozon",
    "yandex_market": "Яндекс Маркет",
    "sber_megamarket": "СберМегаМаркет",
}

MARKETPLACE_LEGAL_NAMES = {
    "wildberries": "ООО «Вайлдберриз»",
    "ozon": "ООО «Интернет Решения»",
    "yandex_market": "ООО «Яндекс.Маркет»",
    "sber_megamarket": "ООО «МегаМаркет»",
}

VIOLATION_TYPES = Literal[
    "unauthorized_penalty",   # Незаконное штрафование (ст.5 ФЗ-289)
    "ranking_manipulation",   # Пессимизация в поиске (ст.5 ФЗ-289)
    "unfair_blocking",        # Блокировка без обоснования (ст.6 ФЗ-289)
    "forced_promotion",       # Принудительное участие в акции (ст.4 ФЗ-289)
    "offer_change_no_notice", # Изменение оферты без 45-дневного уведомления (ст.4 ФЗ-289)
    "unlawful_return",        # Необоснованный возврат (ГК РФ)
    "price_dumping_demand",   # Требование снижения цены (ФЗ-135)
]

DOC_STATUSES = Literal["draft", "sent", "response_received", "closed"]

# ---------------------------------------------------------------------------
# Вспомогательные функции валидации ИНН / ОГРН
# ---------------------------------------------------------------------------

_INN_WEIGHTS_10 = [2, 4, 10, 3, 5, 9, 4, 6, 8]
_INN_WEIGHTS_12_N1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
_INN_WEIGHTS_12_N2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]


def validate_inn(inn: str) -> bool:
    """Проверяет контрольную сумму ИНН (10 или 12 цифр)."""
    if not re.match(r"^\d{10}$|^\d{12}$", inn):
        return False
    digits = [int(c) for c in inn]
    if len(digits) == 10:
        check = sum(w * d for w, d in zip(_INN_WEIGHTS_10, digits[:9])) % 11 % 10
        return check == digits[9]
    # 12 цифр
    n1 = sum(w * d for w, d in zip(_INN_WEIGHTS_12_N1, digits[:10])) % 11 % 10
    n2 = sum(w * d for w, d in zip(_INN_WEIGHTS_12_N2, digits[:11])) % 11 % 10
    return n1 == digits[10] and n2 == digits[11]


def validate_ogrn(ogrn: str) -> bool:
    """Проверяет контрольную сумму ОГРН (13 цифр) или ОГРНИП (15 цифр)."""
    if not re.match(r"^\d{13}$|^\d{15}$", ogrn):
        return False
    if len(ogrn) == 13:
        check = int(ogrn[:-1]) % 11 % 10
    else:
        check = int(ogrn[:-1]) % 13 % 10
    return check == int(ogrn[-1])


# ---------------------------------------------------------------------------
# Pydantic-схемы с жёсткой валидацией
# ---------------------------------------------------------------------------

class ComplaintRequest(BaseModel):
    """Запрос на генерацию досудебной претензии по ФЗ-289."""

    marketplace: SUPPORTED_MARKETPLACES = Field(
        ..., description="Идентификатор маркетплейса"
    )
    article_number: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Артикул товара",
    )
    violation_type: VIOLATION_TYPES = Field(
        ..., description="Тип нарушения"
    )
    violation_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Дата нарушения в формате YYYY-MM-DD",
    )
    violation_description: str = Field(
        ...,
        min_length=20,
        max_length=2000,
        description="Описание нарушения (минимум 20 символов)",
    )
    penalty_amount: float = Field(
        default=0.0,
        ge=0,
        le=10_000_000,
        description="Сумма штрафа в рублях (0 если не применимо)",
    )
    seller_inn: Optional[str] = Field(
        default=None,
        description="ИНН продавца (10 или 12 цифр)",
    )
    seller_ogrn: Optional[str] = Field(
        default=None,
        description="ОГРН/ОГРНИП продавца",
    )

    @field_validator("article_number")
    @classmethod
    def article_number_no_special(cls, v: str) -> str:
        if not re.match(r"^[\w\-\./ ]+$", v, re.UNICODE):
            raise ValueError("Артикул содержит недопустимые символы")
        return v.strip()

    @field_validator("violation_date")
    @classmethod
    def violation_date_not_future(cls, v: str) -> str:
        try:
            d = date.fromisoformat(v)
        except ValueError:
            raise ValueError("Некорректная дата. Формат: YYYY-MM-DD")
        if d > date.today():
            raise ValueError("Дата нарушения не может быть в будущем")
        # Не принимаем даты старше 3 лет (срок исковой давности)
        if (date.today() - d).days > 1095:
            raise ValueError("Дата нарушения превышает срок исковой давности (3 года)")
        return v

    @field_validator("seller_inn")
    @classmethod
    def inn_checksum(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r"^\d{10}$|^\d{12}$", v):
            raise ValueError("ИНН должен содержать 10 или 12 цифр")
        if not validate_inn(v):
            raise ValueError("Некорректный ИНН (неверная контрольная сумма)")
        return v

    @field_validator("seller_ogrn")
    @classmethod
    def ogrn_checksum(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r"^\d{13}$|^\d{15}$", v):
            raise ValueError("ОГРН должен содержать 13 цифр, ОГРНИП — 15 цифр")
        if not validate_ogrn(v):
            raise ValueError("Некорректный ОГРН (неверная контрольная сумма)")
        return v


class FASComplaintRequest(BaseModel):
    """Запрос на генерацию жалобы в ФАС."""

    marketplace: SUPPORTED_MARKETPLACES
    violation_description: str = Field(..., min_length=50, max_length=3000)
    evidence_description: str = Field(..., min_length=20, max_length=2000)
    seller_inn: Optional[str] = Field(default=None)

    @field_validator("seller_inn")
    @classmethod
    def inn_checksum(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r"^\d{10}$|^\d{12}$", v):
            raise ValueError("ИНН должен содержать 10 или 12 цифр")
        if not validate_inn(v):
            raise ValueError("Некорректный ИНН (неверная контрольная сумма)")
        return v


class OfferChangeRequest(BaseModel):
    """Запрос на генерацию уведомления об изменении оферты."""

    marketplace: SUPPORTED_MARKETPLACES
    change_description: str = Field(..., min_length=20, max_length=1000)
    change_effective_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Дата вступления изменений в силу",
    )
    notification_received_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Дата получения уведомления продавцом",
    )

    @model_validator(mode="after")
    def check_notice_period(self) -> "OfferChangeRequest":
        try:
            effective = date.fromisoformat(self.change_effective_date)
            received = date.fromisoformat(self.notification_received_date)
        except ValueError:
            raise ValueError("Некорректный формат дат")
        days_notice = (effective - received).days
        if days_notice < 0:
            raise ValueError("Дата вступления в силу не может быть раньше даты уведомления")
        # Сохраняем для использования в генераторе
        object.__setattr__(self, "_days_notice", days_notice)
        return self

    @property
    def days_notice(self) -> int:
        return getattr(self, "_days_notice", 0)


class DocumentStatusUpdate(BaseModel):
    """Обновление статуса юридического документа."""

    new_status: DOC_STATUSES = Field(..., description="Новый статус документа")
    comment: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Комментарий к изменению статуса",
    )

    @field_validator("new_status")
    @classmethod
    def status_transition_valid(cls, v: str) -> str:
        # Просто валидируем допустимые значения, бизнес-логику переходов
        # проверяем в эндпоинте с учётом текущего статуса
        return v


class LegalDocResponse(BaseModel):
    """Ответ с юридическим документом."""

    id: int
    doc_type: str
    title: str
    content: str
    marketplace: Optional[str]
    status: str
    template_used: Optional[str]
    case_details: Optional[dict]
    sent_at: Optional[str]
    response_received_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class LegalDocListItem(BaseModel):
    """Краткая информация о документе для списка."""

    id: int
    doc_type: str
    title: str
    marketplace: Optional[str]
    status: str
    created_at: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Вспомогательные функции
# ---------------------------------------------------------------------------

# Допустимые переходы статусов
_VALID_TRANSITIONS = {
    "draft": {"sent", "closed"},
    "sent": {"response_received", "closed"},
    "response_received": {"closed"},
    "closed": set(),
}


def _build_doc_response(doc: LegalDoc) -> LegalDocResponse:
    return LegalDocResponse(
        id=doc.id,
        doc_type=doc.doc_type,
        title=doc.title,
        content=doc.content,
        marketplace=doc.marketplace,
        status=doc.status,
        template_used=doc.template_used,
        case_details=doc.case_details,
        sent_at=doc.sent_at.isoformat() if doc.sent_at else None,
        response_received_at=(
            doc.response_received_at.isoformat() if doc.response_received_at else None
        ),
        created_at=doc.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Эндпоинты
# ---------------------------------------------------------------------------

@router.post(
    "/complaint",
    response_model=LegalDocResponse,
    status_code=http_status.HTTP_201_CREATED,
    summary="Генерация досудебной претензии по ФЗ-289",
)
async def generate_complaint(
    request: ComplaintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LegalDocResponse:
    """
    Генерирует досудебную претензию на основе ФЗ № 289-ФЗ.

    Маппинг нарушений на статьи:
    - unauthorized_penalty → ст. 5 (прозрачность алгоритмов)
    - ranking_manipulation → ст. 5 (необоснованная пессимизация)
    - unfair_blocking → ст. 6 (блокировка без обоснования)
    - forced_promotion → ст. 4 (принуждение к акциям)
    - offer_change_no_notice → ст. 4 (нарушение 45-дневного срока)
    - unlawful_return → ГК РФ ст. 469, 475
    - price_dumping_demand → ФЗ-135 ст. 10
    """
    generator = LegalDocGenerator()

    seller_name = current_user.full_name or current_user.email
    seller_inn = request.seller_inn or ""

    content = generator.generate_complaint_289fz(
        seller_name=seller_name,
        seller_inn=seller_inn,
        marketplace_name=MARKETPLACE_DISPLAY.get(request.marketplace, request.marketplace),
        marketplace_legal_name=MARKETPLACE_LEGAL_NAMES.get(
            request.marketplace, request.marketplace
        ),
        article_number=request.article_number,
        violation_type=request.violation_type,
        violation_date=request.violation_date,
        violation_description=request.violation_description,
        penalty_amount=request.penalty_amount,
    )

    doc = LegalDoc(
        user_id=current_user.id,
        doc_type="complaint",
        title=f"Претензия #{request.marketplace.upper()}-{request.article_number}",
        marketplace=request.marketplace,
        content=content,
        template_used="complaint_289fz",
        case_details={
            "article": request.article_number,
            "violation_date": request.violation_date,
            "violation_type": request.violation_type,
            "penalty_amount": request.penalty_amount,
            "seller_inn": seller_inn,
            "seller_ogrn": request.seller_ogrn or "",
        },
        status="draft",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    logger.info("Сгенерирована претензия id=%d user_id=%d", doc.id, current_user.id)
    return _build_doc_response(doc)


@router.post(
    "/fas-complaint",
    response_model=LegalDocResponse,
    status_code=http_status.HTTP_201_CREATED,
    summary="Генерация жалобы в ФАС",
)
async def generate_fas_complaint(
    request: FASComplaintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LegalDocResponse:
    """
    Генерирует жалобу в Федеральную антимонопольную службу
    по фактам недобросовестной конкуренции или злоупотребления
    доминирующим положением маркетплейса.
    """
    generator = LegalDocGenerator()
    seller_name = current_user.full_name or current_user.email

    content = generator.generate_fas_complaint(
        seller_name=seller_name,
        marketplace_name=MARKETPLACE_DISPLAY.get(request.marketplace, request.marketplace),
        violation_description=request.violation_description,
        evidence_description=request.evidence_description,
    )

    doc = LegalDoc(
        user_id=current_user.id,
        doc_type="fas_complaint",
        title=f"Жалоба в ФАС на {MARKETPLACE_DISPLAY.get(request.marketplace)}",
        marketplace=request.marketplace,
        content=content,
        template_used="fas_complaint",
        case_details={
            "seller_inn": request.seller_inn or "",
            "violation_description": request.violation_description[:200],
        },
        status="draft",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    logger.info("Сгенерирована жалоба в ФАС id=%d user_id=%d", doc.id, current_user.id)
    return _build_doc_response(doc)


@router.post(
    "/offer-change-notification",
    response_model=LegalDocResponse,
    status_code=http_status.HTTP_201_CREATED,
    summary="Фиксация нарушения 45-дневного срока уведомления об изменении оферты",
)
async def generate_offer_change_notification(
    request: OfferChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LegalDocResponse:
    """
    Генерирует документ-фиксацию нарушения ст. 4 ФЗ-289:
    маркетплейс изменил условия оферты без 45-дневного уведомления.
    """
    generator = LegalDocGenerator()

    content = generator.generate_offer_change_notification(
        change_description=request.change_description,
        change_date=request.change_effective_date,
        notification_requirement_days=45,
    )

    days_notice = (
        date.fromisoformat(request.change_effective_date)
        - date.fromisoformat(request.notification_received_date)
    ).days

    doc = LegalDoc(
        user_id=current_user.id,
        doc_type="offer_change_notification",
        title=f"Нарушение уведомления об оферте — {MARKETPLACE_DISPLAY.get(request.marketplace)}",
        marketplace=request.marketplace,
        content=content,
        template_used="offer_change_notification",
        case_details={
            "change_effective_date": request.change_effective_date,
            "notification_received_date": request.notification_received_date,
            "actual_notice_days": days_notice,
            "required_notice_days": 45,
            "violation": days_notice < 45,
        },
        status="draft",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _build_doc_response(doc)


@router.get(
    "/documents",
    response_model=List[LegalDocListItem],
    summary="Список документов пользователя с фильтрацией",
)
async def get_legal_documents(
    doc_type: Optional[str] = Query(
        default=None,
        description="Фильтр по типу: complaint, fas_complaint, offer_change_notification",
    ),
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        description="Фильтр по статусу: draft, sent, response_received, closed",
    ),
    marketplace: Optional[str] = Query(
        default=None,
        description="Фильтр по маркетплейсу",
    ),
    page: int = Query(default=0, ge=0, description="Номер страницы (с 0)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Размер страницы"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[LegalDocListItem]:
    """
    Возвращает список юридических документов пользователя.
    Поддерживает фильтрацию по типу, статусу, маркетплейсу и пагинацию.
    """
    query = db.query(LegalDoc).filter(LegalDoc.user_id == current_user.id)

    if doc_type:
        query = query.filter(LegalDoc.doc_type == doc_type)
    if status_filter:
        query = query.filter(LegalDoc.status == status_filter)
    if marketplace:
        query = query.filter(LegalDoc.marketplace == marketplace)

    total = query.count()
    docs = (
        query
        .order_by(LegalDoc.created_at.desc())
        .offset(page * page_size)
        .limit(page_size)
        .all()
    )

    return [
        LegalDocListItem(
            id=doc.id,
            doc_type=doc.doc_type,
            title=doc.title,
            marketplace=doc.marketplace,
            status=doc.status,
            created_at=doc.created_at.isoformat(),
        )
        for doc in docs
    ]


@router.get(
    "/documents/{doc_id}",
    response_model=LegalDocResponse,
    summary="Получить полный текст документа",
)
async def get_legal_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LegalDocResponse:
    """Возвращает полный текст юридического документа."""
    doc = db.query(LegalDoc).filter(
        LegalDoc.id == doc_id,
        LegalDoc.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Документ не найден",
        )
    return _build_doc_response(doc)


@router.patch(
    "/documents/{doc_id}/status",
    response_model=LegalDocResponse,
    summary="Обновить статус документа",
)
async def update_document_status(
    doc_id: int,
    update: DocumentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LegalDocResponse:
    """
    Обновляет статус юридического документа.

    Допустимые переходы:
    - draft → sent | closed
    - sent → response_received | closed
    - response_received → closed
    - closed → (нет переходов)
    """
    doc = db.query(LegalDoc).filter(
        LegalDoc.id == doc_id,
        LegalDoc.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Документ не найден",
        )

    allowed = _VALID_TRANSITIONS.get(doc.status, set())
    if update.new_status not in allowed:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Переход '{doc.status}' → '{update.new_status}' не допустим. "
                f"Разрешённые переходы: {sorted(allowed) or 'нет'}"
            ),
        )

    doc.status = update.new_status
    now = datetime.utcnow()
    if update.new_status == "sent":
        doc.sent_at = now
    elif update.new_status == "response_received":
        doc.response_received_at = now

    db.commit()
    db.refresh(doc)
    logger.info("Статус документа id=%d обновлён: %s", doc.id, update.new_status)
    return _build_doc_response(doc)


@router.get(
    "/templates",
    summary="Список доступных шаблонов документов",
)
async def get_templates(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Возвращает список доступных шаблонов юридических документов."""
    generator = LegalDocGenerator()
    return {"templates": generator.get_template_list()}


@router.delete(
    "/documents/{doc_id}",
    status_code=http_status.HTTP_204_NO_CONTENT,
    summary="Удалить документ",
)
async def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Удаляет юридический документ.
    Нельзя удалить документы в статусе 'sent' или 'response_received'.
    """
    doc = db.query(LegalDoc).filter(
        LegalDoc.id == doc_id,
        LegalDoc.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Документ не найден",
        )
    if doc.status in ("sent", "response_received"):
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=(
                f"Нельзя удалить документ в статусе '{doc.status}'. "
                "Сначала закройте его (статус 'closed')."
            ),
        )
    db.delete(doc)
    db.commit()
    logger.info("Документ id=%d удалён пользователем id=%d", doc_id, current_user.id)
