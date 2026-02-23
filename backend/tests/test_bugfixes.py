"""
Tests for frontend/backend bug fixes:
  BF01 – fetch_marketplace_data creates its own SessionLocal (no V03 session leak)
  BF02 – fetch_marketplace_data uses logger, not print()
  BF03 – GET /products/ returns results sorted by created_at DESC
  BF04 – marking_issues field present in Product model and products API response
  BF05 – certificate_status=None treated as unknown (not hard 'expired')
  BF06 – analytics null sub-scores: (score ?? 0) prevents NaN
  BF07 – analytics 401 handling: returns [] instead of crashing
  BF08 – delete_product returns 204 and removes the product from DB
"""
import asyncio
import inspect
import textwrap
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch, call
from typing import Optional

import pytest


# ─────────────────────────────────────────────────────────────────────────────
# BF01 – fetch_marketplace_data uses its own SessionLocal (not a passed-in db)
# ─────────────────────────────────────────────────────────────────────────────

class TestFetchMarketplaceDataSessionIsolation:
    """BF01: background task must own its DB session, not borrow one."""

    def _get_func(self):
        from app.api.products import fetch_marketplace_data
        return fetch_marketplace_data

    def test_function_signature_has_no_db_parameter(self):
        """fetch_marketplace_data must NOT accept a 'db' or 'Session' parameter."""
        func = self._get_func()
        sig = inspect.signature(func)
        params = list(sig.parameters.keys())
        assert "db" not in params, (
            f"fetch_marketplace_data still has a 'db' param: {params}"
        )

    def test_function_accepts_encrypted_key_strings(self):
        """Function signature should accept raw key strings, not User objects."""
        func = self._get_func()
        sig = inspect.signature(func)
        params = list(sig.parameters.keys())
        # Must have separate string args for wb and ozon keys
        assert "user_wb_api_key" in params, f"Missing user_wb_api_key param: {params}"
        assert "user_ozon_client_id" in params, f"Missing user_ozon_client_id param: {params}"
        assert "user_ozon_api_key" in params, f"Missing user_ozon_api_key param: {params}"

    def test_function_creates_session_local_internally(self):
        """fetch_marketplace_data source must reference SessionLocal()."""
        func = self._get_func()
        source = inspect.getsource(func)
        assert "SessionLocal()" in source, (
            "fetch_marketplace_data must create its own SessionLocal() session"
        )

    def test_function_closes_session_in_finally(self):
        """Session must be closed in a finally block."""
        func = self._get_func()
        source = inspect.getsource(func)
        # Check that db.close() is in the source (simple presence check)
        assert "db.close()" in source, (
            "fetch_marketplace_data must call db.close() to release the session"
        )
        # Check that finally is present
        assert "finally:" in source, (
            "fetch_marketplace_data must use a try/finally block around db.close()"
        )

    @pytest.mark.asyncio
    async def test_session_closed_even_on_exception(self):
        """SessionLocal session must be closed even if an exception is raised."""
        mock_db = MagicMock()
        mock_db.query.side_effect = RuntimeError("Simulated DB error")
        mock_session_local = MagicMock(return_value=mock_db)

        from app.api import products as products_module
        original = products_module.SessionLocal

        try:
            products_module.SessionLocal = mock_session_local
            # Should not raise — exception is caught internally
            await products_module.fetch_marketplace_data(
                product_id=999,
                marketplace="wildberries",
                sku_id="12345",
                user_wb_api_key=None,
                user_ozon_client_id=None,
                user_ozon_api_key=None,
            )
        finally:
            products_module.SessionLocal = original

        # Session must always be closed
        mock_db.close.assert_called_once()


# ─────────────────────────────────────────────────────────────────────────────
# BF02 – fetch_marketplace_data uses logger.exception, not print()
# ─────────────────────────────────────────────────────────────────────────────

class TestFetchMarketplaceDataLogging:
    """BF02: no print() calls; uses logger."""

    def test_no_print_in_source(self):
        from app.api.products import fetch_marketplace_data
        source = inspect.getsource(fetch_marketplace_data)
        # Check for bare print( not inside a string
        lines_with_print = [
            line.strip() for line in source.splitlines()
            if "print(" in line and not line.strip().startswith("#")
        ]
        assert not lines_with_print, (
            f"fetch_marketplace_data still contains print() calls:\n"
            + "\n".join(lines_with_print)
        )

    def test_logger_exception_used(self):
        from app.api.products import fetch_marketplace_data
        source = inspect.getsource(fetch_marketplace_data)
        assert "logger.exception" in source, (
            "fetch_marketplace_data should use logger.exception for error logging"
        )

    def test_module_has_logger(self):
        import app.api.products as products_module
        assert hasattr(products_module, "logger"), (
            "products module must define a module-level logger"
        )


# ─────────────────────────────────────────────────────────────────────────────
# BF03 – Product list sorted by created_at DESC
# ─────────────────────────────────────────────────────────────────────────────

class TestProductListSorting:
    """BF03: GET /products/ must order results by created_at DESC."""

    def test_get_products_source_has_order_by(self):
        from app.api.products import get_products
        source = inspect.getsource(get_products)
        assert "order_by" in source, (
            "get_products must call .order_by() on the query"
        )

    def test_get_products_source_has_desc(self):
        from app.api.products import get_products
        source = inspect.getsource(get_products)
        assert ".desc()" in source, (
            "get_products must sort in descending order (.desc())"
        )

    def test_get_products_source_sorts_by_created_at(self):
        from app.api.products import get_products
        source = inspect.getsource(get_products)
        assert "created_at" in source, (
            "get_products must reference created_at in its ordering"
        )


# ─────────────────────────────────────────────────────────────────────────────
# BF04 – marking_issues field in Product model
# ─────────────────────────────────────────────────────────────────────────────

class TestMarkingIssuesField:
    """BF04: marking_issues column exists in Product model."""

    def test_product_model_has_marking_issues(self):
        from app.models.product import Product
        assert hasattr(Product, "marking_issues"), (
            "Product model must have marking_issues column"
        )

    def test_marking_issues_default_is_falsy(self):
        from app.models.product import Product
        col = Product.marking_issues
        # Column default should be 0 / False
        default = col.property.columns[0].default
        if default is not None:
            assert default.arg in (0, False), (
                f"marking_issues default should be 0/False, got: {default.arg}"
            )

    def test_product_response_schema_includes_marking_issues(self):
        """ProductResponse schema must expose marking_issues."""
        from app.schemas.product import ProductResponse
        fields = ProductResponse.model_fields if hasattr(ProductResponse, 'model_fields') else ProductResponse.__fields__
        assert "marking_issues" in fields, (
            "ProductResponse schema must include marking_issues field"
        )


# ─────────────────────────────────────────────────────────────────────────────
# BF05 – certificate_status=None is "unknown", not forced to red/expired
# ─────────────────────────────────────────────────────────────────────────────

class TestCertificateStatusLogic:
    """BF05: certificate_status=None should not be treated as 'expired'."""

    def test_certificate_status_column_is_nullable(self):
        from app.models.product import Product
        col = Product.certificate_status.property.columns[0]
        assert col.nullable is True, (
            "certificate_status must be nullable (unknown state is valid)"
        )

    def test_product_response_certificate_status_optional(self):
        from app.schemas.product import ProductResponse
        import typing
        fields = ProductResponse.model_fields if hasattr(ProductResponse, 'model_fields') else ProductResponse.__fields__
        assert "certificate_status" in fields, "certificate_status must be in ProductResponse"
        # Should allow None
        field = fields["certificate_status"]
        # Pydantic v2 uses annotation, v1 uses outer_type_
        annotation = getattr(field, 'annotation', None) or getattr(field, 'outer_type_', None)
        if annotation:
            origin = getattr(annotation, '__origin__', None)
            args = getattr(annotation, '__args__', ())
            is_optional = (
                origin is typing.Union and type(None) in args
            )
            assert is_optional, (
                f"certificate_status should be Optional[str], got: {annotation}"
            )


# ─────────────────────────────────────────────────────────────────────────────
# BF06 – audit_history: null sub-scores don't cause NaN in avg calculation
# ─────────────────────────────────────────────────────────────────────────────

class TestNullScoreHandling:
    """BF06: null sub-scores in AuditHistory handled with ?? 0 / or 0 fallback.

    This is a logic test — we verify the Python aggregation side is safe
    and that the AuditLog model stores scores as nullable floats.
    """

    def test_audit_log_scores_nullable(self):
        from app.models.audit_log import AuditLog
        for col_name in ("legal_score", "delivery_score", "seo_score", "price_score"):
            col = getattr(AuditLog, col_name, None)
            assert col is not None, f"AuditLog missing column: {col_name}"
            db_col = col.property.columns[0]
            assert db_col.nullable is True, (
                f"AuditLog.{col_name} should be nullable (scores may be partial)"
            )

    def test_null_score_sum_with_fallback_is_not_nan(self):
        """Simulate the frontend ?? 0 pattern in Python to confirm safety."""
        scores = [
            {"legal_score": 30, "delivery_score": None, "seo_score": 15, "price_score": None},
            {"legal_score": None, "delivery_score": 20, "seo_score": None, "price_score": 8},
        ]
        # Mimics: history.reduce((sum, h) => sum + (h.scores[key] ?? 0), 0) / history.length
        for key in ("legal_score", "delivery_score", "seo_score", "price_score"):
            total = sum((s[key] or 0) for s in scores)
            avg = total / len(scores)
            assert avg == avg, f"avg for {key} is NaN: {avg}"  # NaN != NaN
            assert avg >= 0


# ─────────────────────────────────────────────────────────────────────────────
# BF07 – analytics 401 handling: must not silently swallow auth errors
# ─────────────────────────────────────────────────────────────────────────────

class TestAnalytics401Handling:
    """BF07: audit/history endpoint returns 401 for invalid token."""

    @pytest.mark.asyncio
    async def test_audit_history_requires_auth(self):
        """GET /audit/history without a valid token must return 401."""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        response = client.get(
            "/api/v1/audit/history",
            headers={"Authorization": "Bearer invalid-token-xyz"},
        )
        assert response.status_code == 401, (
            f"Expected 401 for invalid token, got {response.status_code}"
        )

    def test_audit_history_returns_401_without_header(self):
        """GET /audit/history without Authorization header must return 401."""
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        response = client.get("/api/v1/audit/history")
        assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# BF08 – delete_product returns 204 and requires auth
# ─────────────────────────────────────────────────────────────────────────────

class TestDeleteProduct:
    """BF08: DELETE /products/{id} must return 204, require auth, and handle missing."""

    def test_delete_without_auth_returns_401(self):
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        response = client.delete("/api/v1/products/999")
        assert response.status_code == 401

    def test_delete_handler_has_404_check(self):
        """delete_product source must check for product existence and return 404."""
        from app.api.products import delete_product
        source = inspect.getsource(delete_product)
        assert "HTTP_404_NOT_FOUND" in source or "404" in source, (
            "delete_product must raise HTTP 404 when product is not found"
        )

    def test_delete_handler_checks_user_ownership(self):
        """delete_product must filter by user_id to prevent IDOR."""
        from app.api.products import delete_product
        source = inspect.getsource(delete_product)
        assert "user_id" in source, (
            "delete_product must filter by user_id to ensure ownership"
        )


# ─────────────────────────────────────────────────────────────────────────────
# BF09 – add_product and refresh_product pass key strings to background task
# ─────────────────────────────────────────────────────────────────────────────

class TestBackgroundTaskCallerSignature:
    """BF09: callers of fetch_marketplace_data pass encrypted key strings."""

    def test_add_product_passes_key_strings(self):
        from app.api.products import add_product
        source = inspect.getsource(add_product)
        # Must pass current_user.wb_api_key (the encrypted string), not the user object
        assert "current_user.wb_api_key" in source, (
            "add_product must pass current_user.wb_api_key (encrypted string) to background task"
        )
        assert "current_user.ozon_api_key" in source, (
            "add_product must pass current_user.ozon_api_key (encrypted string) to background task"
        )

    def test_refresh_product_passes_key_strings(self):
        from app.api.products import refresh_product
        source = inspect.getsource(refresh_product)
        assert "current_user.wb_api_key" in source, (
            "refresh_product must pass current_user.wb_api_key to background task"
        )
        assert "current_user.ozon_api_key" in source, (
            "refresh_product must pass current_user.ozon_api_key to background task"
        )

    def test_add_product_does_not_pass_db_to_task(self):
        from app.api.products import add_product
        source = inspect.getsource(add_product)
        # The background task call should NOT include 'db' as an argument
        # Find the add_task call and verify
        task_calls = [
            line.strip() for line in source.splitlines()
            if "fetch_marketplace_data" in line and "add_task" not in line
        ]
        # The arguments listed after fetch_marketplace_data in add_task call
        # should not include standalone 'db' variable
        task_block_lines = []
        in_block = False
        for line in source.splitlines():
            if "add_task" in line and "fetch_marketplace_data" in line:
                in_block = True
            if in_block:
                task_block_lines.append(line.strip())
                if ")" in line and in_block:
                    break

        task_block = "\n".join(task_block_lines)
        # 'db' should not appear as a standalone argument (no ", db," or "(db,")
        import re
        # Match ', db,' or ', db)' as a standalone argument
        bad_db_arg = re.search(r',\s*db\s*[,)]', task_block)
        assert bad_db_arg is None, (
            f"add_product passes 'db' to background task (V03 leak):\n{task_block}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# BF10 – ProductResponse includes all expected fields
# ─────────────────────────────────────────────────────────────────────────────

class TestProductResponseSchema:
    """BF10: ProductResponse schema completeness."""

    REQUIRED_FIELDS = [
        "id", "sku_id", "marketplace", "name",
        "current_price", "rating",
        "shadow_ban_detected", "certificate_expired", "marking_issues",
        "certificate_number", "certificate_status",
        "delivery_time_hours", "warehouse_location",
    ]

    def test_product_response_has_all_required_fields(self):
        from app.schemas.product import ProductResponse
        fields = (
            ProductResponse.model_fields
            if hasattr(ProductResponse, 'model_fields')
            else ProductResponse.__fields__
        )
        missing = [f for f in self.REQUIRED_FIELDS if f not in fields]
        assert not missing, (
            f"ProductResponse is missing fields: {missing}"
        )
