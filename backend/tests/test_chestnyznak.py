"""
Тесты для ChestnyznakService (ГИС МТ «Честный ЗНАК»).

Покрываются:
- validate_marking_code — форматы и граничные случаи
- is_marking_required — все группы товаров
- get_product_group — определение группы по названию
- _calculate_marking_risk — уровни риска по расхождению
- verify_stock_compliance — логика сверки остатков
- check_marking_code — валидация входных данных и HTTP-мокирование
- check_product_group_codes — проверка авторизации
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.chestnyznak import (
    ChestnyznakService,
    MarkingStatus,
    RiskLevel,
    MARKED_PRODUCT_GROUPS,
    validate_marking_code,
)


# ---------------------------------------------------------------------------
# Тесты validate_marking_code
# ---------------------------------------------------------------------------

class TestValidateMarkingCode:

    @pytest.mark.parametrize("code,is_valid", [
        # Валидные коды (минимум 18 печатных ASCII-символов)
        ("0104601234567890215678901234", True),   # Стандартный GS1 DM
        ("ABCDEFGHIJKLMNOPQRS", True),             # 19 ASCII-символов
        ("A" * 18, True),                          # Ровно 18 символов
        ("A" * 120, True),                         # Максимальный размер
        # Невалидные
        ("", False),                               # Пустая строка
        ("  ", False),                             # Пробелы
        ("SHORT", False),                          # Меньше 18 символов
        ("A" * 121, False),                        # Больше 120 символов
        ("КМ-С-КИРИЛЛИЦЕЙ!!!", False),             # Кириллица (не ASCII-печатные)
        ("\x00" * 20, False),                      # Управляющие символы
    ])
    def test_validate_code_formats(self, code, is_valid):
        ok, msg = validate_marking_code(code)
        assert ok == is_valid, f"Код '{code[:30]}': ожидался {is_valid}, msg={msg}"

    def test_empty_returns_false_with_message(self):
        ok, msg = validate_marking_code("")
        assert not ok
        assert "пустым" in msg.lower()

    def test_too_short_returns_message_with_length(self):
        ok, msg = validate_marking_code("ABCD")
        assert not ok
        assert "4" in msg  # длина в сообщении


# ---------------------------------------------------------------------------
# Тесты is_marking_required
# ---------------------------------------------------------------------------

class TestIsMarkingRequired:

    def setup_method(self):
        self.service = ChestnyznakService()

    @pytest.mark.parametrize("category,expected", [
        ("обувь мужская", True),
        ("Кроссовки Nike", True),
        ("Сигареты Marlboro", True),
        ("Духи женские", True),
        ("Шины летние 205/55 R16", True),
        ("Молоко ультрапастеризованное 1л", True),
        ("Велосипед горный", True),
        ("Пиво светлое 0.5л", True),
        # Не требуют маркировки
        ("Книга по программированию", False),
        ("Игрушка мягкая", False),
        ("Кухонная посуда", False),
        ("", False),
    ])
    def test_marking_required(self, category, expected):
        result = self.service.is_marking_required(category)
        assert result == expected, f"Категория '{category}': ожидался {expected}"


# ---------------------------------------------------------------------------
# Тесты get_product_group
# ---------------------------------------------------------------------------

class TestGetProductGroup:

    def setup_method(self):
        self.service = ChestnyznakService()

    def test_shoes_detected(self):
        assert self.service.get_product_group("обувь мужская") == "shoes"

    def test_clothes_detected(self):
        assert self.service.get_product_group("куртка зимняя") == "clothes"

    def test_tobacco_detected(self):
        assert self.service.get_product_group("сигареты пачка") == "tobacco"

    def test_dairy_detected(self):
        assert self.service.get_product_group("сыр твёрдый 200г") == "dairy"

    def test_unknown_returns_none(self):
        assert self.service.get_product_group("пылесос Dyson") is None

    def test_empty_returns_none(self):
        assert self.service.get_product_group("") is None


# ---------------------------------------------------------------------------
# Тесты _calculate_marking_risk
# ---------------------------------------------------------------------------

class TestCalculateMarkingRisk:

    @pytest.mark.parametrize("discrepancy,total,expected_level", [
        (0, 100, RiskLevel.LOW),       # Полное совпадение
        (0, 0, RiskLevel.MEDIUM),      # Нет данных
        (3, 100, RiskLevel.MEDIUM),    # 3% расхождение
        (5, 100, RiskLevel.MEDIUM),    # Ровно 5%
        (10, 100, RiskLevel.HIGH),     # 10% расхождение
        (20, 100, RiskLevel.HIGH),     # Ровно 20%
        (21, 100, RiskLevel.CRITICAL), # >20% расхождение
        (100, 100, RiskLevel.CRITICAL),# 100% расхождение
    ])
    def test_risk_levels(self, discrepancy, total, expected_level):
        result = ChestnyznakService._calculate_marking_risk(discrepancy, total)
        assert result == expected_level, (
            f"discrepancy={discrepancy}, total={total}: "
            f"ожидался {expected_level}, получен {result}"
        )


# ---------------------------------------------------------------------------
# Тесты check_marking_code — валидация входных данных
# ---------------------------------------------------------------------------

class TestCheckMarkingCodeValidation:

    def setup_method(self):
        self.service = ChestnyznakService()

    @pytest.mark.asyncio
    async def test_invalid_code_raises_value_error(self):
        with pytest.raises(ValueError, match="короткий"):
            await self.service.check_marking_code("SHORT")

    @pytest.mark.asyncio
    async def test_unknown_product_group_raises_value_error(self):
        valid_code = "A" * 20
        with pytest.raises(ValueError, match="Неизвестная товарная группа"):
            await self.service.check_marking_code(valid_code, product_group="unknown_group")

    @pytest.mark.asyncio
    async def test_valid_code_without_token_uses_public_api(self):
        """Без api_key должен использоваться публичный API ФНС."""
        valid_code = "0104601234567890215678901234"
        with patch.object(
            self.service, "_check_via_public", new_callable=AsyncMock,
            return_value={"code": valid_code, "status": MarkingStatus.IN_CIRCULATION, "is_valid": True}
        ) as mock_pub:
            result = await self.service.check_marking_code(valid_code, "shoes")
        mock_pub.assert_awaited_once_with(valid_code)
        assert result["is_valid"] is True

    @pytest.mark.asyncio
    async def test_valid_code_with_token_uses_ismp_api(self):
        """С api_key должен использоваться ISMP API."""
        service = ChestnyznakService(api_key="test-token")
        valid_code = "0104601234567890215678901234"
        with patch.object(
            service, "_check_via_ismp", new_callable=AsyncMock,
            return_value={"code": valid_code, "status": MarkingStatus.IN_CIRCULATION, "is_valid": True}
        ) as mock_ismp:
            result = await service.check_marking_code(valid_code, "shoes")
        mock_ismp.assert_awaited_once_with(valid_code, "shoes")


# ---------------------------------------------------------------------------
# Тесты _normalize_code_info
# ---------------------------------------------------------------------------

class TestNormalizeCodeInfo:

    def setup_method(self):
        self.service = ChestnyznakService()

    def test_normalize_in_circulation(self):
        data = {
            "status": "INTRODUCED",
            "ownerInn": "7700000001",
            "ownerName": "ООО Продавец",
            "productName": "Кроссовки",
            "gtin": "04601234567890",
        }
        result = self.service._normalize_code_info("TEST_CODE", data)
        assert result["status"] == MarkingStatus.IN_CIRCULATION
        assert result["is_valid"] is True
        assert result["risk_level"] == RiskLevel.LOW
        assert result["owner_inn"] == "7700000001"

    def test_normalize_retired(self):
        data = {"status": "RETIRED"}
        result = self.service._normalize_code_info("TEST_CODE", data)
        assert result["status"] == MarkingStatus.RETIRED
        assert result["is_valid"] is False
        assert result["risk_level"] == RiskLevel.HIGH

    def test_normalize_unknown_status(self):
        data = {"status": "SOME_UNKNOWN_STATUS"}
        result = self.service._normalize_code_info("TEST_CODE", data)
        assert result["status"] == MarkingStatus.UNKNOWN
        assert result["is_valid"] is False

    def test_normalize_russian_status(self):
        data = {"status": "В обороте"}
        result = self.service._normalize_code_info("TEST_CODE", data)
        assert result["status"] == MarkingStatus.IN_CIRCULATION
        assert result["is_valid"] is True


# ---------------------------------------------------------------------------
# Тесты verify_stock_compliance
# ---------------------------------------------------------------------------

class TestVerifyStockCompliance:

    def setup_method(self):
        self.service = ChestnyznakService()

    @pytest.mark.asyncio
    async def test_full_compliance(self):
        """100% коды действительны."""
        codes = ["A" * 20, "B" * 20]
        with patch.object(
            self.service, "check_marking_code", new_callable=AsyncMock,
            return_value={"is_valid": True, "status": MarkingStatus.IN_CIRCULATION}
        ):
            result = await self.service.verify_stock_compliance(codes, declared_quantity=2)

        assert result["valid_codes_count"] == 2
        assert result["invalid_codes_count"] == 0
        assert result["has_grey_stock"] is False
        assert result["risk_level"] == RiskLevel.LOW
        assert result["compliance_percentage"] == 100.0

    @pytest.mark.asyncio
    async def test_partial_compliance_high_risk(self):
        """50% кодов не действительны → high риск."""
        codes = ["A" * 20, "B" * 20]

        async def side_effect(code, **kwargs):
            if code.startswith("A"):
                return {"is_valid": True}
            return {"is_valid": False, "status": MarkingStatus.RETIRED}

        with patch.object(self.service, "check_marking_code", side_effect=side_effect):
            result = await self.service.verify_stock_compliance(codes, declared_quantity=2)

        assert result["valid_codes_count"] == 1
        assert result["has_grey_stock"] is True
        assert result["risk_level"] == RiskLevel.CRITICAL  # 50% > 20%

    @pytest.mark.asyncio
    async def test_empty_codes_raises_value_error(self):
        with pytest.raises(ValueError, match="пустым"):
            await self.service.verify_stock_compliance([], declared_quantity=10)

    @pytest.mark.asyncio
    async def test_negative_quantity_raises_value_error(self):
        with pytest.raises(ValueError, match="отрицательным"):
            await self.service.verify_stock_compliance(["A" * 20], declared_quantity=-1)

    @pytest.mark.asyncio
    async def test_invalid_code_counted_as_invalid(self):
        """Невалидный формат кода вызывает ValueError в check_marking_code → invalid."""
        # "INVALID" — 7 символов, меньше минимума 18. НЕ мокируем check_marking_code,
        # чтобы validate_marking_code реально выбрасывал ValueError,
        # а verify_stock_compliance ловил его и считал как invalid.
        codes = ["INVALID"]  # слишком короткий код

        # Не мокируем check_marking_code — пусть поднимает ValueError
        with patch.object(
            self.service, "_check_via_public", new_callable=AsyncMock,
            return_value={"is_valid": True}
        ):
            result = await self.service.verify_stock_compliance(codes, declared_quantity=1)

        # ValueError пойман → invalid
        assert result["invalid_codes_count"] == 1
        assert result["has_grey_stock"] is True


# ---------------------------------------------------------------------------
# Тесты check_product_group_codes — авторизация
# ---------------------------------------------------------------------------

class TestCheckProductGroupCodes:

    @pytest.mark.asyncio
    async def test_no_api_key_raises_permission_error(self):
        service = ChestnyznakService()  # Без токена
        with pytest.raises(PermissionError, match="аутентификация"):
            await service.check_product_group_codes("7700000001", "shoes")

    @pytest.mark.asyncio
    async def test_invalid_inn_raises_value_error(self):
        service = ChestnyznakService(api_key="test-token")
        with pytest.raises(ValueError, match="ИНН"):
            await service.check_product_group_codes("123", "shoes")

    @pytest.mark.asyncio
    async def test_invalid_group_raises_value_error(self):
        service = ChestnyznakService(api_key="test-token")
        with pytest.raises(ValueError, match="товарная группа"):
            await service.check_product_group_codes("7700000001", "unknown_group")
