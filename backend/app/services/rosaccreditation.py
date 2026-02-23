"""
Rosaccreditation API integration service
ФГИС Росаккредитация — проверка сертификатов соответствия и деклараций

Официальный публичный портал: https://pub.fsa.gov.ru
API документация: https://pub.fsa.gov.ru/openapi/

Типы документов:
- Сертификаты соответствия (ТС/ГОСТ Р): pub.fsa.gov.ru/rss/certificate
- Декларации о соответствии ЕАЭС: pub.fsa.gov.ru/rds/declaration
- Декларации ГОСТ Р: pub.fsa.gov.ru/rss/declaration

Форматы номеров:
- Сертификат ТС: РОСС RU.АЯ87.В00001 или EAC RU RU.XXXX.A.XXXXX
- Декларация ЕАЭС: ЕАЭС N RU Д-RU.РА01.В.00001/24
- Декларация ГОСТ Р: РОСС RU.XXXXX.Д.XXXXXX
"""
import re
import logging
from datetime import date, datetime
from typing import Optional, Dict, Any, Literal
from enum import Enum

import httpx

logger = logging.getLogger(__name__)


class CertificateStatus(str, Enum):
    ACTIVE = "ACTIVE"               # Действует
    SUSPENDED = "SUSPENDED"         # Приостановлен
    TERMINATED = "TERMINATED"       # Прекращён
    ANNULLED = "ANNULLED"           # Аннулирован
    EXPIRED = "EXPIRED"             # Истёк срок действия
    UNKNOWN = "UNKNOWN"             # Не определён


class CertificateType(str, Enum):
    CERTIFICATE_TC = "certificate_tc"         # Сертификат ТС (ЕАЭС)
    CERTIFICATE_GOST = "certificate_gost"     # Сертификат ГОСТ Р
    DECLARATION_TC = "declaration_tc"         # Декларация ТС (ЕАЭС)
    DECLARATION_GOST = "declaration_gost"     # Декларация ГОСТ Р


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Маппинг статусов из API к внутренним статусам
_STATUS_MAP: Dict[str, CertificateStatus] = {
    # Сертификаты ТС
    "1": CertificateStatus.ACTIVE,
    "2": CertificateStatus.SUSPENDED,
    "3": CertificateStatus.TERMINATED,
    "4": CertificateStatus.ANNULLED,
    # Текстовые значения
    "действует": CertificateStatus.ACTIVE,
    "приостановлен": CertificateStatus.SUSPENDED,
    "прекращён": CertificateStatus.TERMINATED,
    "прекращен": CertificateStatus.TERMINATED,
    "аннулирован": CertificateStatus.ANNULLED,
    # Английские алиасы (резервные)
    "active": CertificateStatus.ACTIVE,
    "valid": CertificateStatus.ACTIVE,
    "suspended": CertificateStatus.SUSPENDED,
    "terminated": CertificateStatus.TERMINATED,
    "annulled": CertificateStatus.ANNULLED,
    "cancelled": CertificateStatus.ANNULLED,
}

# Регулярные выражения для валидации номеров документов
_CERT_TC_PATTERN = re.compile(
    r"^(ЕАЭС|EAC)\s+(N\s+)?[A-ZА-Я]{2}[\s\-]?[А-ЯA-Z0-9\.\-]{5,30}$",
    re.IGNORECASE,
)
_CERT_GOST_PATTERN = re.compile(
    r"^РОСС\s+[A-ZА-Я]{2}\.[\wА-Я]{4,8}\.[A-ZА-Я]\d{5,6}(/\d{2})?$",
    re.IGNORECASE,
)
_DECL_TC_PATTERN = re.compile(
    r"^ЕАЭС\s+N\s+[A-ZА-Я]{2}\s+[ДD]\-[A-ZА-Я]{2}\.[А-ЯA-Z]{2}\d{2}\.[А-ЯA-Z]\.\d{5,6}/\d{2}$",
    re.IGNORECASE,
)


def validate_certificate_number(number: str) -> Optional[CertificateType]:
    """
    Валидирует формат номера сертификата/декларации.
    Возвращает тип документа или None если формат не распознан.
    """
    n = number.strip()
    if _DECL_TC_PATTERN.match(n):
        return CertificateType.DECLARATION_TC
    if _CERT_TC_PATTERN.match(n):
        return CertificateType.CERTIFICATE_TC
    if _CERT_GOST_PATTERN.match(n):
        return CertificateType.CERTIFICATE_GOST
    return None


class RosaccreditationService:
    """
    Сервис интеграции с ФГИС Росаккредитация.

    Публичный API не требует аутентификации для базовых запросов поиска.
    Официальный портал: https://pub.fsa.gov.ru

    Endpoints (актуальные на 2026 г.):
      Сертификаты ТС:
        POST https://pub.fsa.gov.ru/api/v1/rss/common/certificates/get
        GET  https://pub.fsa.gov.ru/api/v1/rss/common/certificates/{id}
      Декларации ЕАЭС:
        POST https://pub.fsa.gov.ru/api/v1/rds/common/declarations/get
        GET  https://pub.fsa.gov.ru/api/v1/rds/common/declarations/{id}
      Декларации ГОСТ Р:
        POST https://pub.fsa.gov.ru/api/v1/rss/common/declarations/get
    """

    BASE_URL = "https://pub.fsa.gov.ru/api/v1"
    REQUEST_TIMEOUT = 30.0
    MAX_RETRIES = 2

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self._headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if api_key:
            self._headers["Authorization"] = f"Bearer {api_key}"

    # ------------------------------------------------------------------
    # Публичные методы
    # ------------------------------------------------------------------

    async def check_certificate(self, certificate_number: str) -> Optional[Dict[str, Any]]:
        """
        Проверяет сертификат/декларацию в ФГИС Росаккредитация.

        Автоматически определяет тип документа по формату номера
        и выбирает правильный endpoint.

        Returns:
            Dict с полями: number, status, valid_from, valid_until,
            product_name, applicant, doc_type, risk_level, portal_url
            или None при ошибке запроса.

        Raises:
            ValueError: если формат номера явно некорректен.
        """
        number = certificate_number.strip()
        if not number:
            raise ValueError("Номер сертификата не может быть пустым")
        if len(number) < 10:
            raise ValueError(f"Слишком короткий номер сертификата: '{number}'")

        doc_type = validate_certificate_number(number)

        # Выбираем endpoint по типу документа
        if doc_type == CertificateType.DECLARATION_TC:
            return await self._search_declaration_tc(number)
        elif doc_type == CertificateType.CERTIFICATE_TC:
            return await self._search_certificate_tc(number)
        else:
            # Пробуем сертификаты ТС, затем декларации ЕАЭС, затем ГОСТ Р
            for search_fn in (
                self._search_certificate_tc,
                self._search_declaration_tc,
                self._search_declaration_gost,
            ):
                result = await search_fn(number)
                if result is not None:
                    return result
            return None

    async def check_declaration(self, declaration_number: str) -> Optional[Dict[str, Any]]:
        """Алиас для обратной совместимости — проверяет декларацию."""
        return await self.check_certificate(declaration_number)

    def is_certificate_valid(self, cert_data: Optional[Dict[str, Any]]) -> bool:
        """Возвращает True только если статус ACTIVE и срок не истёк."""
        if not cert_data:
            return False
        status = cert_data.get("status")
        if status != CertificateStatus.ACTIVE:
            return False
        # Дополнительная проверка даты окончания
        valid_until = cert_data.get("valid_until")
        if valid_until:
            try:
                exp = datetime.fromisoformat(valid_until).date()
                if exp < date.today():
                    return False
            except (ValueError, TypeError):
                pass
        return True

    def get_certificate_risk_level(self, cert_data: Optional[Dict[str, Any]]) -> RiskLevel:
        """
        Определяет уровень риска на основе статуса сертификата.
        """
        if not cert_data:
            return RiskLevel.CRITICAL

        status = cert_data.get("status")

        if status == CertificateStatus.ANNULLED:
            return RiskLevel.CRITICAL
        if status == CertificateStatus.SUSPENDED:
            return RiskLevel.HIGH
        if status == CertificateStatus.TERMINATED:
            return RiskLevel.HIGH
        if status == CertificateStatus.EXPIRED:
            return RiskLevel.HIGH

        # Сертификат действует — проверяем, не истекает ли скоро
        if status == CertificateStatus.ACTIVE:
            valid_until = cert_data.get("valid_until")
            if valid_until:
                try:
                    exp = datetime.fromisoformat(valid_until).date()
                    days_left = (exp - date.today()).days
                    if days_left < 0:
                        return RiskLevel.HIGH     # Уже истёк
                    if days_left < 30:
                        return RiskLevel.MEDIUM   # Истекает в течение месяца
                except (ValueError, TypeError):
                    pass
            return RiskLevel.LOW

        return RiskLevel.MEDIUM  # UNKNOWN

    def get_portal_url(self, certificate_number: str) -> str:
        """Возвращает ссылку на запись в публичном реестре FSA."""
        doc_type = validate_certificate_number(certificate_number.strip())
        if doc_type == CertificateType.DECLARATION_TC:
            return f"https://pub.fsa.gov.ru/rds/declaration/view/{certificate_number}"
        if doc_type == CertificateType.CERTIFICATE_TC:
            return f"https://pub.fsa.gov.ru/rss/certificate/view/{certificate_number}"
        # По умолчанию — поиск
        return f"https://pub.fsa.gov.ru/rss/certificate"

    # ------------------------------------------------------------------
    # Приватные методы — работа с API
    # ------------------------------------------------------------------

    async def _search_certificate_tc(self, number: str) -> Optional[Dict[str, Any]]:
        """
        Поиск сертификата ТС/ЕАЭС по номеру.
        POST /api/v1/rss/common/certificates/get
        """
        url = f"{self.BASE_URL}/rss/common/certificates/get"
        payload = {
            "page": 0,
            "size": 1,
            "filter": {
                "regNumber": number,
            },
            "columnsSort": [{"column": "date", "sortOrder": "DESC"}],
        }
        raw = await self._post(url, payload)
        if raw and raw.get("items"):
            return self._normalize_certificate(raw["items"][0], CertificateType.CERTIFICATE_TC)
        return None

    async def _search_declaration_tc(self, number: str) -> Optional[Dict[str, Any]]:
        """
        Поиск декларации ЕАЭС по номеру.
        POST /api/v1/rds/common/declarations/get
        """
        url = f"{self.BASE_URL}/rds/common/declarations/get"
        payload = {
            "page": 0,
            "size": 1,
            "filter": {"regNumber": number},
            "columnsSort": [{"column": "date", "sortOrder": "DESC"}],
        }
        raw = await self._post(url, payload)
        if raw and raw.get("items"):
            return self._normalize_certificate(raw["items"][0], CertificateType.DECLARATION_TC)
        return None

    async def _search_declaration_gost(self, number: str) -> Optional[Dict[str, Any]]:
        """
        Поиск декларации ГОСТ Р по номеру.
        POST /api/v1/rss/common/declarations/get
        """
        url = f"{self.BASE_URL}/rss/common/declarations/get"
        payload = {
            "page": 0,
            "size": 1,
            "filter": {"regNumber": number},
            "columnsSort": [{"column": "date", "sortOrder": "DESC"}],
        }
        raw = await self._post(url, payload)
        if raw and raw.get("items"):
            return self._normalize_certificate(raw["items"][0], CertificateType.DECLARATION_GOST)
        return None

    def _normalize_certificate(
        self, raw: Dict[str, Any], doc_type: CertificateType
    ) -> Dict[str, Any]:
        """Приводит ответ API к единому формату."""
        raw_status = str(raw.get("status", raw.get("idStatus", ""))).lower()
        status = _STATUS_MAP.get(raw_status, CertificateStatus.UNKNOWN)

        number = raw.get("regNumber", raw.get("number", ""))

        return {
            "number": number,
            "status": status,
            "valid_from": raw.get("dateBegin", raw.get("validFrom")),
            "valid_until": raw.get("dateEnd", raw.get("validUntil")),
            "product_name": raw.get("objectName", raw.get("productName", "")),
            "applicant": raw.get("applicantName", raw.get("declarantName", "")),
            "doc_type": doc_type,
            "certification_body": raw.get("fpName", raw.get("certificationBody", "")),
            "portal_url": self.get_portal_url(number),
            "risk_level": self.get_certificate_risk_level(
                {"status": status, "valid_until": raw.get("dateEnd", raw.get("validUntil"))}
            ),
        }

    async def _post(
        self, url: str, payload: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Выполняет POST-запрос с retry-логикой."""
        last_exc: Optional[Exception] = None
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.REQUEST_TIMEOUT) as client:
                    response = await client.post(url, headers=self._headers, json=payload)
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 404:
                    return None  # Запись не найдена — не ошибка
                logger.warning(
                    "HTTP %s при запросе %s (попытка %d/%d): %s",
                    exc.response.status_code,
                    url,
                    attempt + 1,
                    self.MAX_RETRIES + 1,
                    exc,
                )
                last_exc = exc
            except httpx.TimeoutException:
                logger.warning("Таймаут запроса к %s (попытка %d)", url, attempt + 1)
                last_exc = Exception("timeout")
            except Exception as exc:
                logger.error("Ошибка запроса к %s: %s", url, exc)
                last_exc = exc
                break  # Не повторяем при неожиданных ошибках
        logger.error("Все %d попытки запроса к %s завершились ошибкой: %s",
                     self.MAX_RETRIES + 1, url, last_exc)
        return None
