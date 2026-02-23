"""
Тесты для RosaccreditationService (ФГИС Росаккредитация).

Покрываются:
- Валидация форматов номеров сертификатов и деклараций
- Определение типа документа
- Логика is_certificate_valid (статус + дата истечения)
- Логика get_certificate_risk_level
- Нормализация ответа API
- Retry-логика и обработка ошибок HTTP (мокирование httpx)
"""
import pytest
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.rosaccreditation import (
    RosaccreditationService,
    CertificateStatus,
    CertificateType,
    RiskLevel,
    validate_certificate_number,
)


# ---------------------------------------------------------------------------
# Тесты validate_certificate_number
# ---------------------------------------------------------------------------

class TestValidateCertificateNumber:

    @pytest.mark.parametrize("number,expected_type", [
        # Декларации ЕАЭС
        ("ЕАЭС N RU Д-RU.РА01.В.00001/24", CertificateType.DECLARATION_TC),
        ("ЕАЭС N RU Д-RU.НА02.В.12345/26", CertificateType.DECLARATION_TC),
        # Сертификаты ТС (EAC/ЕАЭС)
        ("EAC RU RU.АЯ87.В00001", CertificateType.CERTIFICATE_TC),
        # ГОСТ Р
        ("РОСС RU.АЯ87.В00001", CertificateType.CERTIFICATE_GOST),
        ("РОСС RU.ХМРС.В00001/25", CertificateType.CERTIFICATE_GOST),
        # Нераспознанные форматы → None
        ("", None),
        ("ABC-123", None),
        ("1234567890", None),
    ])
    def test_format_detection(self, number, expected_type):
        result = validate_certificate_number(number)
        assert result == expected_type, (
            f"Для номера '{number}' ожидался тип {expected_type}, получен {result}"
        )


# ---------------------------------------------------------------------------
# Тесты is_certificate_valid
# ---------------------------------------------------------------------------

class TestIsCertificateValid:

    def setup_method(self):
        self.service = RosaccreditationService()

    def test_none_input_returns_false(self):
        assert self.service.is_certificate_valid(None) is False

    def test_active_status_no_expiry_returns_true(self):
        assert self.service.is_certificate_valid({
            "status": CertificateStatus.ACTIVE,
            "valid_until": None,
        }) is True

    def test_active_status_future_expiry_returns_true(self):
        future = (date.today() + timedelta(days=90)).isoformat()
        assert self.service.is_certificate_valid({
            "status": CertificateStatus.ACTIVE,
            "valid_until": future,
        }) is True

    def test_active_status_past_expiry_returns_false(self):
        past = (date.today() - timedelta(days=1)).isoformat()
        assert self.service.is_certificate_valid({
            "status": CertificateStatus.ACTIVE,
            "valid_until": past,
        }) is False

    def test_suspended_status_returns_false(self):
        assert self.service.is_certificate_valid({
            "status": CertificateStatus.SUSPENDED,
            "valid_until": None,
        }) is False

    def test_annulled_status_returns_false(self):
        assert self.service.is_certificate_valid({
            "status": CertificateStatus.ANNULLED,
            "valid_until": None,
        }) is False

    def test_unknown_status_returns_false(self):
        assert self.service.is_certificate_valid({
            "status": CertificateStatus.UNKNOWN,
            "valid_until": None,
        }) is False


# ---------------------------------------------------------------------------
# Тесты get_certificate_risk_level
# ---------------------------------------------------------------------------

class TestGetCertificateRiskLevel:

    def setup_method(self):
        self.service = RosaccreditationService()

    def test_none_returns_critical(self):
        assert self.service.get_certificate_risk_level(None) == RiskLevel.CRITICAL

    def test_annulled_returns_critical(self):
        assert self.service.get_certificate_risk_level(
            {"status": CertificateStatus.ANNULLED}
        ) == RiskLevel.CRITICAL

    def test_suspended_returns_high(self):
        assert self.service.get_certificate_risk_level(
            {"status": CertificateStatus.SUSPENDED}
        ) == RiskLevel.HIGH

    def test_terminated_returns_high(self):
        assert self.service.get_certificate_risk_level(
            {"status": CertificateStatus.TERMINATED}
        ) == RiskLevel.HIGH

    def test_active_far_expiry_returns_low(self):
        future = (date.today() + timedelta(days=180)).isoformat()
        assert self.service.get_certificate_risk_level({
            "status": CertificateStatus.ACTIVE,
            "valid_until": future,
        }) == RiskLevel.LOW

    def test_active_expiring_soon_returns_medium(self):
        soon = (date.today() + timedelta(days=15)).isoformat()
        assert self.service.get_certificate_risk_level({
            "status": CertificateStatus.ACTIVE,
            "valid_until": soon,
        }) == RiskLevel.MEDIUM

    def test_active_already_expired_returns_high(self):
        past = (date.today() - timedelta(days=1)).isoformat()
        assert self.service.get_certificate_risk_level({
            "status": CertificateStatus.ACTIVE,
            "valid_until": past,
        }) == RiskLevel.HIGH

    def test_unknown_status_returns_medium(self):
        assert self.service.get_certificate_risk_level(
            {"status": CertificateStatus.UNKNOWN}
        ) == RiskLevel.MEDIUM


# ---------------------------------------------------------------------------
# Тесты normalize_certificate
# ---------------------------------------------------------------------------

class TestNormalizeCertificate:

    def setup_method(self):
        self.service = RosaccreditationService()

    def test_normalize_active_certificate(self):
        raw = {
            "regNumber": "EAC RU RU.АЯ87.В00001",
            "status": "действует",
            "dateBegin": "2024-01-01",
            "dateEnd": "2027-01-01",
            "objectName": "Ботинки мужские",
            "applicantName": "ООО Тест",
            "fpName": "ООО Орган сертификации",
        }
        result = self.service._normalize_certificate(raw, CertificateType.CERTIFICATE_TC)
        assert result["status"] == CertificateStatus.ACTIVE
        assert result["product_name"] == "Ботинки мужские"
        assert result["doc_type"] == CertificateType.CERTIFICATE_TC
        assert result["risk_level"] == RiskLevel.LOW

    def test_normalize_by_status_id(self):
        """Статус может приходить как строковый ID '1' (Действует) или '4' (Аннулирован)."""
        raw_annulled = {"regNumber": "TEST", "status": "4", "idStatus": "4"}
        result = self.service._normalize_certificate(raw_annulled, CertificateType.CERTIFICATE_TC)
        assert result["status"] == CertificateStatus.ANNULLED
        assert result["risk_level"] == RiskLevel.CRITICAL


# ---------------------------------------------------------------------------
# Тесты check_certificate — мокирование HTTP
# ---------------------------------------------------------------------------

class TestCheckCertificateHTTP:

    def setup_method(self):
        self.service = RosaccreditationService()

    @pytest.mark.asyncio
    async def test_check_valid_certificate_tc(self):
        """Успешный ответ API → нормализованный словарь."""
        mock_response = {
            "items": [{
                "regNumber": "EAC RU RU.АЯ87.В00001",
                "status": "действует",
                "dateBegin": "2024-01-01",
                "dateEnd": "2027-12-31",
                "objectName": "Кроссовки",
                "applicantName": "ООО Продавец",
            }]
        }
        with patch.object(self.service, "_post", new_callable=AsyncMock, return_value=mock_response):
            result = await self.service.check_certificate("EAC RU RU.АЯ87.В00001")
        assert result is not None
        assert result["status"] == CertificateStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_check_certificate_not_found_returns_none(self):
        """Если ни один endpoint не вернул данных → None."""
        with patch.object(self.service, "_post", new_callable=AsyncMock, return_value=None):
            result = await self.service.check_certificate("EAC RU RU.АЯ87.В00001")
        assert result is None

    @pytest.mark.asyncio
    async def test_check_certificate_empty_raises_value_error(self):
        with pytest.raises(ValueError, match="пустым"):
            await self.service.check_certificate("")

    @pytest.mark.asyncio
    async def test_check_certificate_too_short_raises_value_error(self):
        with pytest.raises(ValueError, match="короткий"):
            await self.service.check_certificate("AB12")

    @pytest.mark.asyncio
    async def test_check_certificate_auto_detects_declaration(self):
        """Для декларации ЕАЭС должен вызываться _search_declaration_tc, не _search_certificate_tc."""
        with patch.object(
            self.service, "_search_declaration_tc", new_callable=AsyncMock,
            return_value={"number": "X", "status": CertificateStatus.ACTIVE}
        ) as mock_decl:
            result = await self.service.check_certificate(
                "ЕАЭС N RU Д-RU.РА01.В.00001/24"
            )
        mock_decl.assert_awaited_once()
        assert result is not None


# ---------------------------------------------------------------------------
# Тесты retry-логики
# ---------------------------------------------------------------------------

class TestRetryLogic:

    def setup_method(self):
        self.service = RosaccreditationService()

    @pytest.mark.asyncio
    async def test_retries_on_http_error(self):
        """Должно выполниться MAX_RETRIES + 1 попыток при 500 ошибке."""
        import httpx

        call_count = 0

        async def failing_post(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            mock_resp = MagicMock()
            mock_resp.status_code = 500
            raise httpx.HTTPStatusError("Server Error", request=MagicMock(), response=mock_resp)

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client_cls.return_value.__aenter__.return_value = mock_client
            mock_client.post.side_effect = failing_post

            result = await self.service._post("https://example.com/test", {})

        assert result is None
        # MAX_RETRIES = 2, значит всего 3 попытки
        assert call_count == self.service.MAX_RETRIES + 1
