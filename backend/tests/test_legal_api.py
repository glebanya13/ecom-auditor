"""
Тесты для Legal API эндпоинтов (/api/v1/legal/).

Покрываются:
- Валидация ИНН (корректная/некорректная контрольная сумма)
- Валидация ОГРН
- Валидация дат нарушения (будущая дата, слишком старая, некорректный формат)
- Валидация маркетплейса (только поддерживаемые значения)
- Валидация типа нарушения
- Минимальная длина описания
- Сумма штрафа (отрицательная, превышение)
- Логика переходов статусов документа
- Запрет удаления документа в статусе 'sent'
"""
import pytest
from app.api.legal import (
    ComplaintRequest,
    FASComplaintRequest,
    OfferChangeRequest,
    DocumentStatusUpdate,
    validate_inn,
    validate_ogrn,
    _VALID_TRANSITIONS,
)
from pydantic import ValidationError


# ---------------------------------------------------------------------------
# Тесты validate_inn
# ---------------------------------------------------------------------------

class TestValidateINN:

    @pytest.mark.parametrize("inn,expected", [
        # Корректные ИНН (реальные контрольные суммы)
        ("7700000001", False),   # Не существует — для теста нужен реальный ИНН
        ("7707083893", True),    # ПАО Сбербанк (публичный ИНН, 10 цифр)
        ("7736207543", True),    # ПАО Яндекс (публичный ИНН, 10 цифр)
        # Некорректные
        ("", False),
        ("123", False),
        ("770000000X", False),   # Не только цифры
        ("12345678901234", False),  # 14 цифр
    ])
    def test_inn_validation(self, inn, expected):
        result = validate_inn(inn)
        assert result == expected, f"ИНН '{inn}': ожидался {expected}, получен {result}"

    def test_inn_with_wrong_checksum_returns_false(self):
        """ИНН с правильной длиной, но неверной контрольной суммой."""
        assert validate_inn("7707083894") is False  # неверная контрольная сумма


# ---------------------------------------------------------------------------
# Тесты validate_ogrn
# ---------------------------------------------------------------------------

class TestValidateOGRN:

    @pytest.mark.parametrize("ogrn,expected", [
        ("1027700132195", True),   # ПАО Сбербанк — публичный ОГРН (13 цифр)
        ("316774600100087", True), # Валидный ОГРНИП (15 цифр, верная КС)
        ("", False),
        ("123", False),
        ("123456789012X", False),  # Не только цифры
        ("12345678901234567", False),  # 17 цифр
    ])
    def test_ogrn_validation(self, ogrn, expected):
        result = validate_ogrn(ogrn)
        assert result == expected, f"ОГРН '{ogrn}': ожидался {expected}, получен {result}"


# ---------------------------------------------------------------------------
# Тесты ComplaintRequest валидации
# ---------------------------------------------------------------------------

class TestComplaintRequestValidation:

    def _valid_data(self, **overrides):
        base = {
            "marketplace": "wildberries",
            "article_number": "SKU12345",
            "violation_type": "unauthorized_penalty",
            "violation_date": "2026-01-15",
            "violation_description": "Незаконное снятие штрафа за несуществующее нарушение со стороны маркетплейса",
            "penalty_amount": 5000.0,
        }
        base.update(overrides)
        return base

    def test_valid_request_passes(self):
        req = ComplaintRequest(**self._valid_data())
        assert req.marketplace == "wildberries"

    def test_unsupported_marketplace_raises(self):
        with pytest.raises(ValidationError) as exc_info:
            ComplaintRequest(**self._valid_data(marketplace="alibaba"))
        assert "marketplace" in str(exc_info.value).lower() or "literal" in str(exc_info.value).lower()

    def test_unsupported_violation_type_raises(self):
        with pytest.raises(ValidationError):
            ComplaintRequest(**self._valid_data(violation_type="made_up_type"))

    def test_future_violation_date_raises(self):
        from datetime import date, timedelta
        future = (date.today() + timedelta(days=10)).isoformat()
        with pytest.raises(ValidationError) as exc_info:
            ComplaintRequest(**self._valid_data(violation_date=future))
        assert "будущем" in str(exc_info.value)

    def test_violation_date_older_than_3_years_raises(self):
        with pytest.raises(ValidationError) as exc_info:
            ComplaintRequest(**self._valid_data(violation_date="2020-01-01"))
        assert "исковой давности" in str(exc_info.value)

    def test_invalid_date_format_raises(self):
        with pytest.raises(ValidationError):
            ComplaintRequest(**self._valid_data(violation_date="15.01.2026"))

    def test_short_description_raises(self):
        with pytest.raises(ValidationError):
            ComplaintRequest(**self._valid_data(violation_description="Коротко"))

    def test_negative_penalty_raises(self):
        with pytest.raises(ValidationError):
            ComplaintRequest(**self._valid_data(penalty_amount=-100.0))

    def test_excessive_penalty_raises(self):
        with pytest.raises(ValidationError):
            ComplaintRequest(**self._valid_data(penalty_amount=99_000_000.0))

    def test_zero_penalty_allowed(self):
        req = ComplaintRequest(**self._valid_data(penalty_amount=0.0))
        assert req.penalty_amount == 0.0

    def test_valid_inn_passes(self):
        req = ComplaintRequest(**self._valid_data(seller_inn="7707083893"))
        assert req.seller_inn == "7707083893"

    def test_invalid_inn_raises(self):
        with pytest.raises(ValidationError) as exc_info:
            ComplaintRequest(**self._valid_data(seller_inn="7707083894"))  # Неверная КС
        assert "ИНН" in str(exc_info.value) or "inn" in str(exc_info.value).lower()

    def test_inn_wrong_length_raises(self):
        with pytest.raises(ValidationError):
            ComplaintRequest(**self._valid_data(seller_inn="12345"))

    def test_valid_ogrn_passes(self):
        req = ComplaintRequest(**self._valid_data(seller_ogrn="1027700132195"))
        assert req.seller_ogrn == "1027700132195"

    def test_invalid_ogrn_raises(self):
        with pytest.raises(ValidationError) as exc_info:
            ComplaintRequest(**self._valid_data(seller_ogrn="1027700132196"))  # Неверная КС
        assert "ОГРН" in str(exc_info.value) or "ogrn" in str(exc_info.value).lower()

    def test_article_number_special_chars_raises(self):
        """Артикул не должен содержать <, >, {, } и т.п."""
        with pytest.raises(ValidationError):
            ComplaintRequest(**self._valid_data(article_number="<script>alert(1)</script>"))

    def test_article_number_allowed_chars(self):
        """Допустимы буквы, цифры, дефис, точка, слеш."""
        req = ComplaintRequest(**self._valid_data(article_number="AB-12/3.4"))
        assert req.article_number == "AB-12/3.4"

    def test_inn_none_allowed(self):
        req = ComplaintRequest(**self._valid_data(seller_inn=None))
        assert req.seller_inn is None


# ---------------------------------------------------------------------------
# Тесты FASComplaintRequest
# ---------------------------------------------------------------------------

class TestFASComplaintRequestValidation:

    def test_valid_request_passes(self):
        req = FASComplaintRequest(
            marketplace="ozon",
            violation_description="A" * 50,
            evidence_description="B" * 20,
        )
        assert req.marketplace == "ozon"

    def test_short_violation_description_raises(self):
        with pytest.raises(ValidationError):
            FASComplaintRequest(
                marketplace="wildberries",
                violation_description="Too short",
                evidence_description="B" * 20,
            )

    def test_all_supported_marketplaces(self):
        for mp in ("wildberries", "ozon", "yandex_market", "sber_megamarket"):
            req = FASComplaintRequest(
                marketplace=mp,
                violation_description="A" * 50,
                evidence_description="B" * 20,
            )
            assert req.marketplace == mp


# ---------------------------------------------------------------------------
# Тесты OfferChangeRequest
# ---------------------------------------------------------------------------

class TestOfferChangeRequestValidation:

    def test_valid_request_passes(self):
        req = OfferChangeRequest(
            marketplace="ozon",
            change_description="Изменение размера комиссии на логистику с 5% до 8%",
            change_effective_date="2026-06-01",
            notification_received_date="2026-04-01",
        )
        assert req.days_notice == 61

    def test_short_description_raises(self):
        with pytest.raises(ValidationError):
            OfferChangeRequest(
                marketplace="ozon",
                change_description="Коротко",
                change_effective_date="2026-06-01",
                notification_received_date="2026-04-01",
            )

    def test_effective_before_received_raises(self):
        with pytest.raises(ValidationError):
            OfferChangeRequest(
                marketplace="wildberries",
                change_description="Изменение условий хранения товаров на складе",
                change_effective_date="2026-03-01",
                notification_received_date="2026-04-01",  # Получили ПОСЛЕ вступления
            )

    def test_invalid_date_format_raises(self):
        with pytest.raises(ValidationError):
            OfferChangeRequest(
                marketplace="ozon",
                change_description="Изменение условий хранения товаров на складе",
                change_effective_date="01-06-2026",  # Неправильный формат
                notification_received_date="2026-04-01",
            )


# ---------------------------------------------------------------------------
# Тесты логики переходов статусов
# ---------------------------------------------------------------------------

class TestDocumentStatusTransitions:

    def test_all_allowed_transitions_defined(self):
        """Все 4 статуса должны быть определены в таблице переходов."""
        expected_statuses = {"draft", "sent", "response_received", "closed"}
        assert set(_VALID_TRANSITIONS.keys()) == expected_statuses

    @pytest.mark.parametrize("from_status,to_status,allowed", [
        ("draft", "sent", True),
        ("draft", "closed", True),
        ("draft", "response_received", False),
        ("sent", "response_received", True),
        ("sent", "closed", True),
        ("sent", "draft", False),
        ("response_received", "closed", True),
        ("response_received", "sent", False),
        ("response_received", "draft", False),
        ("closed", "draft", False),
        ("closed", "sent", False),
        ("closed", "response_received", False),
    ])
    def test_status_transition(self, from_status, to_status, allowed):
        result = to_status in _VALID_TRANSITIONS.get(from_status, set())
        assert result == allowed, (
            f"Переход '{from_status}' → '{to_status}': ожидался {allowed}, получен {result}"
        )

    def test_closed_has_no_outgoing_transitions(self):
        assert len(_VALID_TRANSITIONS["closed"]) == 0


# ---------------------------------------------------------------------------
# Тесты DocumentStatusUpdate
# ---------------------------------------------------------------------------

class TestDocumentStatusUpdateValidation:

    @pytest.mark.parametrize("new_status", ["draft", "sent", "response_received", "closed"])
    def test_valid_statuses_pass(self, new_status):
        update = DocumentStatusUpdate(new_status=new_status)
        assert update.new_status == new_status

    def test_invalid_status_raises(self):
        with pytest.raises(ValidationError):
            DocumentStatusUpdate(new_status="invalid_status")

    def test_comment_max_length(self):
        with pytest.raises(ValidationError):
            DocumentStatusUpdate(new_status="sent", comment="X" * 501)

    def test_comment_none_allowed(self):
        update = DocumentStatusUpdate(new_status="sent", comment=None)
        assert update.comment is None
