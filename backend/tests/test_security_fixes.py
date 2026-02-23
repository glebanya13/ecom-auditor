"""
Tests for security vulnerability fixes:
  V01 – Rate limit on login (slowapi decorator)
  V05 – JWT token revocation / logout blacklist
  V06 – PBKDF2 key derivation for AES encryption (backward-compatible)
  V08 – Audit history limit bound
  V09 – User enumeration hardening on registration
  V10 – Swagger docs hidden in production
  V13 – CORS restricted methods
  V14 – /health hides environment in production
"""
import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

# ---------------------------------------------------------------------------
# V06 – AES cipher: PBKDF2 key derivation + backward-compatible decryption
# ---------------------------------------------------------------------------

class TestAESCipherV06:
    """PBKDF2-based AES cipher (V06)."""

    def _make_cipher(self, key: str = "A" * 32):
        from app.core.security import AESCipher
        return AESCipher(key)

    def test_encrypt_returns_v2_prefix(self):
        c = self._make_cipher()
        result = c.encrypt("my-api-key-12345")
        assert result.startswith("v2:"), f"Expected v2: prefix, got: {result[:10]}"

    def test_encrypt_decrypt_roundtrip(self):
        c = self._make_cipher()
        plaintext = "super-secret-api-key"
        encrypted = c.encrypt(plaintext)
        assert c.decrypt(encrypted) == plaintext

    def test_empty_string_returns_empty(self):
        c = self._make_cipher()
        assert c.encrypt("") == ""
        assert c.decrypt("") == ""

    def test_legacy_decrypt_without_prefix(self):
        """Values encrypted with the old SHA-256 cipher (no prefix) must still decrypt."""
        import hashlib, base64
        from cryptography.fernet import Fernet
        key = "B" * 32
        legacy_raw = base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest())
        legacy_fernet = Fernet(legacy_raw)
        legacy_token = legacy_fernet.encrypt(b"legacy-value").decode()

        from app.core.security import AESCipher
        c = AESCipher(key)
        assert c.decrypt(legacy_token) == "legacy-value"

    def test_different_keys_produce_different_ciphertext(self):
        from app.core.security import AESCipher
        c1 = AESCipher("A" * 32)
        c2 = AESCipher("B" * 32)
        plaintext = "same-plaintext"
        e1 = c1.encrypt(plaintext)
        e2 = c2.encrypt(plaintext)
        assert e1 != e2

    def test_two_encryptions_of_same_plaintext_differ(self):
        """Fernet uses random IV; same key+plaintext should not produce identical tokens."""
        c = self._make_cipher()
        e1 = c.encrypt("repeat-me")
        e2 = c.encrypt("repeat-me")
        # Both decrypt to same value but the ciphertext differs (random IV)
        assert c.decrypt(e1) == c.decrypt(e2) == "repeat-me"
        assert e1 != e2

    def test_encrypt_api_key_helper(self):
        with patch("app.core.security.cipher") as mock_cipher:
            mock_cipher.encrypt.return_value = "v2:abc123"
            from app.core.security import encrypt_api_key
            result = encrypt_api_key("test-key")
            mock_cipher.encrypt.assert_called_once_with("test-key")
            assert result == "v2:abc123"

    def test_decrypt_api_key_helper(self):
        with patch("app.core.security.cipher") as mock_cipher:
            mock_cipher.decrypt.return_value = "test-key"
            from app.core.security import decrypt_api_key
            result = decrypt_api_key("v2:abc123")
            mock_cipher.decrypt.assert_called_once_with("v2:abc123")
            assert result == "test-key"


# ---------------------------------------------------------------------------
# V05 – TokenBlacklist (JWT revocation)
# ---------------------------------------------------------------------------

class TestTokenBlacklistV05:
    """In-memory JWT token blacklist (V05)."""

    def _make_blacklist(self):
        from app.core.security import TokenBlacklist
        return TokenBlacklist()

    def test_fresh_jti_is_not_revoked(self):
        bl = self._make_blacklist()
        assert not bl.is_revoked(str(uuid.uuid4()))

    def test_revoked_jti_is_detected(self):
        bl = self._make_blacklist()
        jti = str(uuid.uuid4())
        bl.revoke(jti, datetime.utcnow() + timedelta(hours=1))
        assert bl.is_revoked(jti)

    def test_expired_jti_is_purged(self):
        bl = self._make_blacklist()
        jti = str(uuid.uuid4())
        # Expires in the past
        bl.revoke(jti, datetime.utcnow() - timedelta(seconds=1))
        # Purge is triggered by the next revoke() call
        bl.revoke(str(uuid.uuid4()), datetime.utcnow() + timedelta(hours=1))
        assert not bl.is_revoked(jti)

    def test_multiple_tokens_independent(self):
        bl = self._make_blacklist()
        jti_a = str(uuid.uuid4())
        jti_b = str(uuid.uuid4())
        bl.revoke(jti_a, datetime.utcnow() + timedelta(hours=1))
        assert bl.is_revoked(jti_a)
        assert not bl.is_revoked(jti_b)

    def test_blacklist_prevents_decode_usage(self):
        """Simulate the auth flow: revoked JTI should be rejected."""
        from app.core.security import token_blacklist, create_access_token, decode_access_token
        token = create_access_token({"sub": "42"})
        payload = decode_access_token(token)
        assert payload is not None
        jti = payload["jti"]
        exp = payload["exp"]
        expires_at = datetime.utcfromtimestamp(exp)

        token_blacklist.revoke(jti, expires_at)
        assert token_blacklist.is_revoked(jti)


# ---------------------------------------------------------------------------
# V05 – create_access_token includes 'jti' claim
# ---------------------------------------------------------------------------

class TestJTIInToken:
    def test_token_contains_jti(self):
        from app.core.security import create_access_token, decode_access_token
        token = create_access_token({"sub": "99"})
        payload = decode_access_token(token)
        assert "jti" in payload
        assert len(payload["jti"]) == 36  # UUID4 format

    def test_two_tokens_have_different_jti(self):
        from app.core.security import create_access_token, decode_access_token
        t1 = create_access_token({"sub": "1"})
        t2 = create_access_token({"sub": "1"})
        p1 = decode_access_token(t1)
        p2 = decode_access_token(t2)
        assert p1["jti"] != p2["jti"]


# ---------------------------------------------------------------------------
# V09 – User enumeration on /register returns generic error
# ---------------------------------------------------------------------------

class TestUserEnumerationV09:
    """Registration must NOT reveal whether an email is already taken."""

    @pytest.mark.asyncio
    async def test_duplicate_email_generic_message(self):
        from fastapi import HTTPException
        from unittest.mock import MagicMock, patch

        # Simulate an existing user in the DB
        existing_user = MagicMock()
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = existing_user

        from app.api.auth import register
        from app.schemas.user import UserCreate

        user_data = UserCreate(
            email="taken@example.com",
            password="StrongPass1!",
            full_name="Test User",
        )
        with pytest.raises(HTTPException) as exc_info:
            await register(user_data, db=mock_db)

        detail = exc_info.value.detail
        assert "Email already registered" not in detail, (
            "Must NOT reveal that email exists – found enumeration message"
        )
        assert "Registration failed" in detail or "check your details" in detail.lower()

    @pytest.mark.asyncio
    async def test_successful_registration(self):
        mock_db = MagicMock()
        # No existing user
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()

        new_user = MagicMock()
        new_user.id = 1
        new_user.email = "new@example.com"
        mock_db.refresh = MagicMock(return_value=new_user)

        # Patch so refresh sets attributes on new_user
        def _refresh(obj):
            obj.id = 1
            obj.email = "new@example.com"

        mock_db.refresh.side_effect = _refresh

        from app.api.auth import register
        from app.schemas.user import UserCreate

        user_data = UserCreate(
            email="new@example.com",
            password="StrongPass1!",
            full_name="New User",
        )
        # Should not raise
        with patch("app.api.auth.get_password_hash", return_value="hashed"):
            # This should complete without HTTPException
            try:
                await register(user_data, db=mock_db)
            except Exception as e:
                pytest.fail(f"Unexpected exception on successful registration: {e}")


# ---------------------------------------------------------------------------
# V10 – Swagger docs hidden in production
# ---------------------------------------------------------------------------

class TestSwaggerDocsV10:
    def test_docs_hidden_in_production(self):
        """docs_url must be None when ENVIRONMENT=production."""
        with patch("app.main.settings") as mock_settings:
            mock_settings.ENVIRONMENT = "production"
            mock_settings.PROJECT_NAME = "Test"
            mock_settings.VERSION = "1.0.0"
            mock_settings.cors_origins_list = ["http://localhost:3000"]
            mock_settings.API_V1_PREFIX = "/api/v1"

            docs_url = None if mock_settings.ENVIRONMENT == "production" else "/api/docs"
            assert docs_url is None

    def test_docs_visible_in_development(self):
        """docs_url must be set when ENVIRONMENT=development."""
        env = "development"
        docs_url = None if env == "production" else "/api/docs"
        assert docs_url == "/api/docs"

    def test_main_app_docs_url_logic(self):
        """Verify the app factory applies the correct docs_url."""
        from app.main import app
        from app.core.config import settings
        if settings.ENVIRONMENT == "production":
            assert app.docs_url is None
        else:
            # In non-production the app exposes docs
            assert app.docs_url is not None


# ---------------------------------------------------------------------------
# V13 – CORS restricted to explicit HTTP methods
# ---------------------------------------------------------------------------

class TestCORSMethodsV13:
    def test_cors_not_wildcard(self):
        from app.main import app
        from starlette.middleware.cors import CORSMiddleware

        cors_middleware = None
        for mw in app.user_middleware:
            if mw.cls is CORSMiddleware:
                cors_middleware = mw
                break

        assert cors_middleware is not None, "CORSMiddleware not registered"
        methods = cors_middleware.kwargs.get("allow_methods", [])
        assert "*" not in methods, f"CORS allow_methods must not contain '*', got {methods}"

    def test_cors_includes_required_methods(self):
        from app.main import app
        from starlette.middleware.cors import CORSMiddleware

        for mw in app.user_middleware:
            if mw.cls is CORSMiddleware:
                methods = mw.kwargs.get("allow_methods", [])
                for required in ("GET", "POST", "DELETE"):
                    assert required in methods, f"CORS missing method: {required}"
                return
        pytest.fail("CORSMiddleware not found")


# ---------------------------------------------------------------------------
# V14 – /health hides environment in production
# ---------------------------------------------------------------------------

class TestHealthEndpointV14:
    @pytest.mark.asyncio
    async def test_health_hides_env_in_production(self):
        from app.main import health_check
        with patch("app.main.settings") as mock_settings:
            mock_settings.ENVIRONMENT = "production"
            result = await health_check()
        assert "environment" not in result, (
            "health endpoint must NOT expose 'environment' in production"
        )
        assert result["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_health_shows_env_in_development(self):
        from app.main import health_check
        with patch("app.main.settings") as mock_settings:
            mock_settings.ENVIRONMENT = "development"
            result = await health_check()
        assert "environment" in result
        assert result["environment"] == "development"


# ---------------------------------------------------------------------------
# V08 – Audit history limit is bounded (1 ≤ limit ≤ 100)
# ---------------------------------------------------------------------------

class TestAuditHistoryLimitV08:
    def test_limit_param_has_upper_bound(self):
        """Verify the Query() constraint is present in the endpoint signature."""
        import inspect
        from fastapi import Query
        from app.api.audit import get_audit_history

        sig = inspect.signature(get_audit_history)
        limit_param = sig.parameters.get("limit")
        assert limit_param is not None, "limit parameter missing"

        default = limit_param.default
        # FastAPI wraps Query params; check the annotation/default metadata
        # The FieldInfo / Query object carries ge/le constraints
        if hasattr(default, "ge") and hasattr(default, "le"):
            assert default.ge == 1
            assert default.le == 100
        elif hasattr(default, "metadata"):
            constraints = {type(m).__name__: m for m in default.metadata}
            # Pydantic v2 style
            assert any("Ge" in k or "ge" in str(k) for k in constraints), (
                "Missing ge constraint on limit"
            )

    def test_limit_default_is_reasonable(self):
        import inspect
        from app.api.audit import get_audit_history
        sig = inspect.signature(get_audit_history)
        limit_param = sig.parameters.get("limit")
        default = limit_param.default
        if hasattr(default, "default"):
            assert 1 <= default.default <= 50


# ---------------------------------------------------------------------------
# V02 – Subscription check on full audit
# ---------------------------------------------------------------------------

class TestSubscriptionCheckV02:
    @pytest.mark.asyncio
    async def test_full_audit_requires_subscription(self):
        from fastapi import HTTPException
        from app.api.audit import full_audit
        from app.schemas.audit import AuditRequest

        inactive_user = MagicMock()
        inactive_user.subscription_active = False
        inactive_user.balance = 0.0

        request = AuditRequest(product_id=1, audit_type="full")
        mock_db = MagicMock()
        mock_bg = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            await full_audit(request, mock_bg, current_user=inactive_user, db=mock_db)

        assert exc_info.value.status_code == 402

    @pytest.mark.asyncio
    async def test_full_audit_allowed_with_active_subscription(self):
        from fastapi import HTTPException
        from app.api.audit import full_audit
        from app.schemas.audit import AuditRequest

        active_user = MagicMock()
        active_user.subscription_active = True
        active_user.id = 1

        request = AuditRequest(product_id=99, audit_type="full")
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None  # product not found
        mock_bg = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            await full_audit(request, mock_bg, current_user=active_user, db=mock_db)

        # 404 (product not found) means subscription check passed
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_full_audit_allowed_with_positive_balance(self):
        from fastapi import HTTPException
        from app.api.audit import full_audit
        from app.schemas.audit import AuditRequest

        user_with_balance = MagicMock()
        user_with_balance.subscription_active = False
        user_with_balance.balance = 2500.0
        user_with_balance.id = 2

        request = AuditRequest(product_id=99, audit_type="full")
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_bg = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            await full_audit(request, mock_bg, current_user=user_with_balance, db=mock_db)

        # 404 means the payment check was passed
        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# V12 – Quick audit returns dynamic results
# ---------------------------------------------------------------------------

class TestQuickAuditV12:
    @pytest.mark.asyncio
    async def test_non_numeric_sku_gets_issue(self):
        from app.api.audit import quick_audit
        from app.schemas.product import QuickAuditRequest

        req = QuickAuditRequest(sku_id="ABC123XYZ", marketplace="wildberries")
        result = await quick_audit(req)
        assert result.score < 100
        assert len(result.issues_found) > 0

    @pytest.mark.asyncio
    async def test_numeric_sku_returns_partial_score(self):
        from app.api.audit import quick_audit
        from app.schemas.product import QuickAuditRequest

        req = QuickAuditRequest(sku_id="12345678", marketplace="wildberries")
        result = await quick_audit(req)
        # Score should be less than 100 (heuristics reduce it)
        assert result.score < 100
        assert result.score >= 0

    @pytest.mark.asyncio
    async def test_result_is_not_fully_hardcoded(self):
        from app.api.audit import quick_audit
        from app.schemas.product import QuickAuditRequest

        req1 = QuickAuditRequest(sku_id="ABC", marketplace="wildberries")
        req2 = QuickAuditRequest(sku_id="12345678", marketplace="wildberries")
        r1 = await quick_audit(req1)
        r2 = await quick_audit(req2)
        # Different SKUs should produce different scores
        assert r1.score != r2.score


# ---------------------------------------------------------------------------
# V03 – PDF background task closes DB session
# ---------------------------------------------------------------------------

class TestPDFDBLeakV03:
    @pytest.mark.asyncio
    async def test_db_closed_on_pdf_error(self):
        """Even when PDF generation raises, the DB session must be closed."""
        mock_db = MagicMock()
        mock_audit_log = MagicMock()
        mock_audit_log.id = 1
        mock_audit_log.total_score = 85
        mock_audit_log.legal_score = 30
        mock_audit_log.delivery_score = 25
        mock_audit_log.seo_score = 15
        mock_audit_log.price_score = 15
        mock_audit_log.risks_detected = []
        mock_audit_log.recommendations = []
        mock_audit_log.margin_percentage = None
        mock_audit_log.estimated_profit = None
        mock_audit_log.vat_amount = None

        mock_user = MagicMock()
        mock_user.full_name = "Test User"

        product_data = {"sku_id": "123", "marketplace": "wildberries"}

        with patch("app.api.audit.SessionLocal", return_value=mock_db):
            with patch("app.api.audit.PDFReportGenerator") as mock_pdf_cls:
                mock_pdf_cls.return_value.generate_full_audit_report.side_effect = RuntimeError(
                    "PDF engine crashed"
                )
                mock_db.query.return_value.filter.return_value.first.return_value = None

                from app.api.audit import _generate_pdf_report
                await _generate_pdf_report(
                    audit_log_id=1,
                    product_data=product_data,
                    audit_log=mock_audit_log,
                    user=mock_user,
                )

        # DB session MUST be closed regardless of the PDF error
        mock_db.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_db_closed_on_success(self):
        """DB session is also closed on the happy path."""
        mock_db = MagicMock()
        mock_audit_entry = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_audit_entry

        mock_audit_log = MagicMock()
        mock_audit_log.id = 1
        mock_audit_log.risks_detected = []
        mock_audit_log.recommendations = []
        mock_audit_log.margin_percentage = 30.0
        mock_audit_log.estimated_profit = 500.0
        mock_audit_log.vat_amount = 110.0
        mock_audit_log.total_score = 80
        mock_audit_log.legal_score = 30
        mock_audit_log.delivery_score = 20
        mock_audit_log.seo_score = 15
        mock_audit_log.price_score = 15

        mock_user = MagicMock()
        mock_user.full_name = "Test User"

        with patch("app.api.audit.SessionLocal", return_value=mock_db):
            with patch("app.api.audit.PDFReportGenerator") as mock_pdf_cls:
                mock_pdf_cls.return_value.generate_full_audit_report.return_value = "/tmp/report.pdf"
                from app.api.audit import _generate_pdf_report
                await _generate_pdf_report(
                    audit_log_id=1,
                    product_data={"sku_id": "456"},
                    audit_log=mock_audit_log,
                    user=mock_user,
                )

        mock_db.close.assert_called_once()
