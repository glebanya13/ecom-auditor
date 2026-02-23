"""
Chestnyznak (Честный ЗНАК) API integration service
ГИС МТ «Честный ЗНАК» — проверка кодов маркировки товаров

Официальная документация:
  https://честныйзнак.рф/
  https://ismp.crpt.ru/api-docs/

Аутентификация (2-шаговая через КЭП):
  1. GET  /api/v3/true-api/auth/key               → UUID для подписи
  2. POST /api/v3/true-api/auth/simpleSignIn       → токен (UUID подписывается ГОСТ Р 34.10-2012)

Основные проверочные endpoints (доступны без полной аутентификации КЭП):
  GET /api/v3/true-api/products/info?cis={код}    → информация о КМ
  GET /api/v3/true-api/products/serial-numbers/info?cis={код}

Публичная проверка (без токена):
  GET https://markirovka.nalog.ru/api/v0/true/products/{код}

Форматы кодов:
  - GS1 DataMatrix: 01{GTIN14}{17}{expiry}{10}{batch}{21}{serial}
  - KM (код маркировки): 14+5+7 знаков в base64 или спецформат
  - SSCC (поддон): 00{18 цифр}

Группы товаров (pg-коды CRPT):
  shoes, clothes, tobacco, perfume, tires, cameras, lamps,
  dairy, water, beer, antiseptic, fur, medical_devices, bikes
"""
import re
import time
import logging
from typing import Optional, Dict, Any, List, Tuple
from enum import Enum

import httpx

logger = logging.getLogger(__name__)


class MarkingStatus(str, Enum):
    IN_CIRCULATION = "В обороте"      # Легально в обороте
    RETIRED = "Выбыл"                 # Выбыл из оборота (продан/реализован)
    RECYCLED = "Утилизирован"         # Утилизирован
    WRITTEN_OFF = "Списан"            # Списан
    EMITTED = "Эмитирован"            # КМ выпущен, но не введён в оборот
    UNKNOWN = "Неизвестен"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Допустимые группы товаров с обязательной маркировкой на 2026 год
MARKED_PRODUCT_GROUPS: Dict[str, List[str]] = {
    "shoes": ["обувь", "кроссовки", "ботинки", "сапоги", "туфли", "сандали"],
    "clothes": ["одежда", "куртка", "пальто", "брюки", "блузка", "рубашка", "платье", "жакет"],
    "tobacco": ["табак", "сигареты", "сигары", "папиросы", "кальян"],
    "perfume": ["духи", "парфюм", "туалетная вода", "одеколон"],
    "tires": ["шины", "покрышки"],
    "cameras": ["фотоаппарат", "фотокамера"],
    "lamps": ["лампочки", "лампы", "светильники"],
    "dairy": ["молоко", "сыр", "масло", "кефир", "сметана", "творог", "йогурт"],
    "water": ["вода", "минеральная вода"],
    "beer": ["пиво", "пивной напиток"],
    "antiseptic": ["антисептик", "дезинфицирующее средство"],
    "fur": ["шуба", "меховое изделие", "меховая одежда"],
    "medical_devices": ["медицинский прибор", "медизделие", "медтехника"],
    "bikes": ["велосипед"],
    "dietary_supplements": ["бад", "биологически активная добавка"],
}

# Регулярные выражения для валидации форматов КМ
_GS1_DM_PATTERN = re.compile(
    r"^01\d{14}"           # GTIN (14 цифр после AI 01)
    r"(21[\x21-\x7E]{1,20}|17\d{6}10[\x21-\x7E]{1,20}21[\x21-\x7E]{1,20})"
)
_KM_SHORT_PATTERN = re.compile(r"^[\x21-\x7E]{18,120}$")  # Общий KM (base64/ASCII)


def validate_marking_code(code: str) -> Tuple[bool, str]:
    """
    Валидирует формат кода маркировки.

    Returns:
        (is_valid: bool, message: str)
    """
    if not code or not code.strip():
        return False, "Код маркировки не может быть пустым"
    code = code.strip()
    if len(code) < 18:
        return False, f"Код маркировки слишком короткий ({len(code)} символов, минимум 18)"
    if len(code) > 120:
        return False, f"Код маркировки слишком длинный ({len(code)} символов)"
    if not _KM_SHORT_PATTERN.match(code):
        return False, "Код маркировки содержит недопустимые символы"
    return True, "OK"


class ChestnyznakService:
    """
    Сервис интеграции с ГИС МТ «Честный ЗНАК» (CRPT).

    Поддерживает два режима:
    1. С токеном (api_key): полный доступ к деталям КМ через CRPT ISMP API
    2. Без токена: публичная проверка через сервис ФНС/CRPT (ограниченные данные)

    Аутентификация с КЭП:
        service = ChestnyznakService(api_key="<jwt-token>")

    Без аутентификации (только базовые проверки):
        service = ChestnyznakService()
    """

    ISMP_URL = "https://ismp.crpt.ru/api/v3"
    PUBLIC_URL = "https://markirovka.nalog.ru/api/v0"
    REQUEST_TIMEOUT = 20.0
    MAX_RETRIES = 2

    # Кеш токена: (token, expires_at)
    _token_cache: Optional[Tuple[str, float]] = None

    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: JWT-токен CRPT, полученный после подписи UUID с КЭП.
                     Если не передан, используется публичный эндпоинт.
        """
        self.api_key = api_key
        self._base_headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    # ------------------------------------------------------------------
    # Публичные методы
    # ------------------------------------------------------------------

    async def check_marking_code(
        self,
        marking_code: str,
        product_group: str = "shoes",
    ) -> Optional[Dict[str, Any]]:
        """
        Проверяет статус кода маркировки в ГИС МТ.

        Args:
            marking_code: Код маркировки (DataMatrix / base64).
            product_group: Товарная группа (shoes, clothes, dairy и т.д.).

        Returns:
            Dict с полями: code, status, owner_inn, owner_name,
            product_name, emission_date, is_valid, risk_level
            или None при ошибке.

        Raises:
            ValueError: если код маркировки не прошёл валидацию формата.
        """
        is_valid_fmt, msg = validate_marking_code(marking_code)
        if not is_valid_fmt:
            raise ValueError(msg)

        if not product_group or product_group.lower() not in MARKED_PRODUCT_GROUPS:
            raise ValueError(
                f"Неизвестная товарная группа '{product_group}'. "
                f"Доступные: {', '.join(MARKED_PRODUCT_GROUPS)}"
            )

        # Используем ISMP API если есть токен, иначе — публичный API ФНС
        if self.api_key:
            return await self._check_via_ismp(marking_code, product_group)
        return await self._check_via_public(marking_code)

    async def check_product_group_codes(
        self, inn: str, product_group: str
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Получает список КМ для ИНН и товарной группы.
        Требует аутентификацию через КЭП.

        Args:
            inn: ИНН участника оборота (10 или 12 цифр).
            product_group: Товарная группа CRPT.
        """
        if not re.match(r"^\d{10}(\d{2})?$", inn):
            raise ValueError(f"Некорректный ИНН: '{inn}'. Ожидается 10 или 12 цифр.")

        if product_group not in MARKED_PRODUCT_GROUPS:
            raise ValueError(f"Неизвестная товарная группа: '{product_group}'")

        if not self.api_key:
            raise PermissionError("Для получения списка КМ требуется аутентификация (api_key)")

        headers = {**self._base_headers, "Authorization": f"Bearer {self.api_key}"}
        url = f"{self.ISMP_URL}/true-api/doc/receipts"
        params = {"inn": inn, "pg": product_group}

        async with httpx.AsyncClient(timeout=self.REQUEST_TIMEOUT) as client:
            try:
                response = await client.get(url, headers=headers, params=params)
                response.raise_for_status()
                return response.json().get("documents", [])
            except httpx.HTTPStatusError as exc:
                logger.error("HTTP %d при запросе списка КМ: %s", exc.response.status_code, exc)
                return None
            except Exception as exc:
                logger.error("Ошибка запроса списка КМ: %s", exc)
                return None

    async def verify_stock_compliance(
        self,
        marking_codes: List[str],
        declared_quantity: int,
    ) -> Dict[str, Any]:
        """
        Сверяет коды маркировки с декларируемым количеством остатков.
        Помогает выявить «серые» остатки без надлежащей маркировки.

        Args:
            marking_codes: Список КМ для проверки.
            declared_quantity: Заявленное количество единиц на складе.

        Returns:
            Dict: declared_quantity, valid_codes_count, invalid_codes_count,
                  discrepancy, compliance_percentage, has_grey_stock, risk_level,
                  errors (список КМ с ошибками)
        """
        if declared_quantity < 0:
            raise ValueError("Количество остатков не может быть отрицательным")
        if not marking_codes:
            raise ValueError("Список кодов маркировки не может быть пустым")

        valid_codes = 0
        invalid_codes = 0
        errors: List[Dict[str, str]] = []

        for code in marking_codes:
            try:
                result = await self.check_marking_code(code)
                if result and result.get("is_valid"):
                    valid_codes += 1
                else:
                    invalid_codes += 1
                    errors.append({
                        "code": code[:20] + "…" if len(code) > 20 else code,
                        "reason": result.get("status", "unknown") if result else "not_found",
                    })
            except ValueError as exc:
                invalid_codes += 1
                errors.append({"code": code[:20], "reason": str(exc)})

        discrepancy = declared_quantity - valid_codes
        compliance_pct = (valid_codes / declared_quantity * 100) if declared_quantity > 0 else 0.0

        return {
            "declared_quantity": declared_quantity,
            "valid_codes_count": valid_codes,
            "invalid_codes_count": invalid_codes,
            "discrepancy": discrepancy,
            "compliance_percentage": round(compliance_pct, 2),
            "has_grey_stock": discrepancy > 0,
            "risk_level": self._calculate_marking_risk(discrepancy, declared_quantity),
            "errors": errors,
        }

    def is_marking_required(self, product_category: str) -> bool:
        """
        Проверяет, обязательна ли маркировка для данной категории товара в 2026 г.

        Args:
            product_category: Название категории (на русском или английском).
        """
        if not product_category:
            return False
        cat_lower = product_category.lower()
        for group, keywords in MARKED_PRODUCT_GROUPS.items():
            if group in cat_lower:
                return True
            if any(kw in cat_lower for kw in keywords):
                return True
        return False

    def get_product_group(self, product_category: str) -> Optional[str]:
        """
        Определяет код товарной группы CRPT по названию категории.

        Returns:
            Строка-ключ группы (напр. 'shoes') или None.
        """
        cat_lower = product_category.lower()
        for group, keywords in MARKED_PRODUCT_GROUPS.items():
            if group in cat_lower or any(kw in cat_lower for kw in keywords):
                return group
        return None

    # ------------------------------------------------------------------
    # Приватные методы
    # ------------------------------------------------------------------

    async def _check_via_ismp(
        self, code: str, product_group: str
    ) -> Optional[Dict[str, Any]]:
        """Проверка КМ через CRPT ISMP API (требует токен)."""
        headers = {**self._base_headers, "Authorization": f"Bearer {self.api_key}"}
        url = f"{self.ISMP_URL}/true-api/products/info"

        for attempt in range(self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.REQUEST_TIMEOUT) as client:
                    resp = await client.get(url, headers=headers, params={"cis": code})
                    resp.raise_for_status()
                    data = resp.json()
                    return self._normalize_code_info(code, data)
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                if status_code == 401:
                    logger.error("Ошибка авторизации в ГИС МТ: токен недействителен")
                    return None
                if status_code == 404:
                    return {"code": code, "status": MarkingStatus.UNKNOWN,
                            "is_valid": False, "risk_level": RiskLevel.CRITICAL,
                            "error": "КМ не найден в системе"}
                logger.warning("HTTP %d при проверке КМ (попытка %d): %s",
                               status_code, attempt + 1, exc)
            except Exception as exc:
                logger.error("Ошибка проверки КМ через ISMP: %s", exc)
                break
        return None

    async def _check_via_public(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Публичная проверка КМ через ФНС/CRPT без аутентификации.
        Возвращает ограниченную информацию (только статус).
        """
        url = f"{self.PUBLIC_URL}/true/products/{code}"
        try:
            async with httpx.AsyncClient(timeout=self.REQUEST_TIMEOUT) as client:
                resp = await client.get(
                    url,
                    headers={"Accept": "application/json"},
                )
                resp.raise_for_status()
                data = resp.json()
                return self._normalize_code_info(code, data)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return {"code": code, "status": MarkingStatus.UNKNOWN,
                        "is_valid": False, "risk_level": RiskLevel.CRITICAL,
                        "error": "КМ не найден в системе"}
            logger.error("HTTP %d при публичной проверке КМ: %s",
                         exc.response.status_code, exc)
            return None
        except Exception as exc:
            logger.error("Ошибка публичной проверки КМ: %s", exc)
            return None

    def _normalize_code_info(self, code: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Приводит ответ API к единому формату."""
        raw_status = data.get("status", data.get("cisStatus", MarkingStatus.UNKNOWN))
        # Нормализуем статус
        status_map = {
            "INTRODUCED": MarkingStatus.IN_CIRCULATION,
            "RETIRED": MarkingStatus.RETIRED,
            "RECYCLED": MarkingStatus.RECYCLED,
            "WRITTEN_OFF": MarkingStatus.WRITTEN_OFF,
            "EMITTED": MarkingStatus.EMITTED,
            "В обороте": MarkingStatus.IN_CIRCULATION,
            "Выбыл": MarkingStatus.RETIRED,
            "Утилизирован": MarkingStatus.RECYCLED,
            "Списан": MarkingStatus.WRITTEN_OFF,
            "Эмитирован": MarkingStatus.EMITTED,
        }
        status = status_map.get(raw_status, MarkingStatus.UNKNOWN)
        is_valid = status == MarkingStatus.IN_CIRCULATION

        return {
            "code": code,
            "status": status,
            "owner_inn": data.get("ownerInn", data.get("inn")),
            "owner_name": data.get("ownerName", data.get("producerName")),
            "product_name": data.get("productName", data.get("name")),
            "gtin": data.get("gtin"),
            "emission_date": data.get("emissionDate", data.get("producedDate")),
            "emission_type": data.get("emissionType"),
            "is_valid": is_valid,
            "risk_level": RiskLevel.LOW if is_valid else RiskLevel.HIGH,
        }

    @staticmethod
    def _calculate_marking_risk(discrepancy: int, total: int) -> RiskLevel:
        """Вычисляет уровень риска по расхождению количества."""
        if total == 0:
            return RiskLevel.MEDIUM
        pct = (discrepancy / total) * 100
        if pct == 0:
            return RiskLevel.LOW
        if pct <= 5:
            return RiskLevel.MEDIUM
        if pct <= 20:
            return RiskLevel.HIGH
        return RiskLevel.CRITICAL
