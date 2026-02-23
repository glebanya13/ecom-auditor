"""
Tests for external API service fixes:
  V04 – httpx.Timeout on all Wildberries / Ozon calls
  V07 – Ozon get_product_list cursor-based pagination
  V11 – logging replaces print(), no hardcoded dates in Wildberries
"""
from __future__ import annotations

import logging
import inspect
from datetime import date
from typing import Optional, Union
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest


# ---------------------------------------------------------------------------
# Helper: build a minimal httpx.Response for mocking.
# httpx.Response requires a .request to call raise_for_status().
# ---------------------------------------------------------------------------

_FAKE_REQUEST = httpx.Request("POST", "https://example.com")


def _make_response(
    status_code: int,
    json_body: Optional[Union[dict, list]] = None,
) -> httpx.Response:
    import json as _json
    body = _json.dumps(json_body or {}).encode()
    return httpx.Response(
        status_code,
        content=body,
        headers={"content-type": "application/json"},
        request=_FAKE_REQUEST,
    )


# ---------------------------------------------------------------------------
# V04 – WildberriesService: timeout is applied to every method
# ---------------------------------------------------------------------------

class TestWildberriesTimeout:
    def _make_service(self):
        from app.services.wildberries import WildberriesService
        return WildberriesService("test-api-key")

    @pytest.mark.asyncio
    async def test_get_product_info_passes_timeout(self):
        from app.services.wildberries import _TIMEOUT
        svc = self._make_service()
        response = _make_response(200, {"data": [{"name": "Test", "vendorCode": "SKU1"}]})

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            mock_ctx.get = AsyncMock(return_value=response)

            await svc.get_product_info("SKU1")

            call_kwargs = mock_client_cls.call_args
            assert call_kwargs is not None
            assert call_kwargs.kwargs.get("timeout") == _TIMEOUT

    @pytest.mark.asyncio
    async def test_get_product_stocks_passes_timeout(self):
        from app.services.wildberries import _TIMEOUT
        svc = self._make_service()
        response = _make_response(200, [{"supplierArticle": "SKU1", "quantity": 10}])

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            mock_ctx.get = AsyncMock(return_value=response)

            await svc.get_product_stocks("SKU1")
            call_kwargs = mock_client_cls.call_args
            assert call_kwargs.kwargs.get("timeout") == _TIMEOUT

    @pytest.mark.asyncio
    async def test_check_sku_exists_passes_timeout(self):
        from app.services.wildberries import _TIMEOUT
        svc = self._make_service()
        response = _make_response(200, {
            "data": {"listGoods": [{"nmID": 123, "sizes": [{"discountedPrice": 1000}]}]}
        })

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            mock_ctx.get = AsyncMock(return_value=response)

            await svc.check_sku_exists("123")
            call_kwargs = mock_client_cls.call_args
            assert call_kwargs.kwargs.get("timeout") == _TIMEOUT

    @pytest.mark.asyncio
    async def test_timeout_is_correct_values(self):
        from app.services.wildberries import _TIMEOUT
        assert _TIMEOUT.read == 15.0
        assert _TIMEOUT.connect == 5.0

    @pytest.mark.asyncio
    async def test_http_error_returns_none(self):
        svc = self._make_service()
        err_response = _make_response(500)

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            err_response.raise_for_status = MagicMock(
                side_effect=httpx.HTTPStatusError("error", request=MagicMock(), response=err_response)
            )
            mock_ctx.get = AsyncMock(return_value=err_response)

            result = await svc.get_product_info("BAD_SKU")
            assert result is None


# ---------------------------------------------------------------------------
# V11 – WildberriesService: no hardcoded date for stocks
# ---------------------------------------------------------------------------

class TestWildberriesNoDynamicDate:
    @pytest.mark.asyncio
    async def test_stocks_uses_today_date(self):
        """dateFrom must be today's date, not a hardcoded '2026-01-01'."""
        from app.services.wildberries import WildberriesService
        svc = WildberriesService("key")
        captured_params: list = []

        response = _make_response(200, [])

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            async def _capture_get(url, **kwargs):
                captured_params.append(kwargs.get("params", {}))
                return response

            mock_ctx.get = _capture_get
            await svc.get_product_stocks("SKU1")

        assert captured_params, "No GET call captured"
        date_from = captured_params[0].get("dateFrom", "")
        assert date_from == date.today().isoformat(), (
            f"dateFrom should be today ({date.today().isoformat()}), got '{date_from}'"
        )
        assert date_from != "2026-01-01", "dateFrom must not be hardcoded to 2026-01-01"


# ---------------------------------------------------------------------------
# V11 – WildberriesService: logging instead of print
# ---------------------------------------------------------------------------

class TestWildberriesLogging:
    def test_no_print_in_source(self):
        """Ensure no bare print() calls remain in wildberries.py."""
        import ast
        import pathlib
        src = pathlib.Path("app/services/wildberries.py").read_text()
        tree = ast.parse(src)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                func = node.func
                if isinstance(func, ast.Name) and func.id == "print":
                    pytest.fail(
                        f"Found bare print() at line {node.lineno} in wildberries.py"
                    )

    def test_warning_logged_on_http_error(self, caplog):
        """An HTTP error should produce a WARNING log, not a print."""
        from app.services.wildberries import WildberriesService
        svc = WildberriesService("key")
        err_response = _make_response(503)

        with caplog.at_level(logging.WARNING, logger="app.services.wildberries"):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_ctx = AsyncMock()
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
                err_response.raise_for_status = MagicMock(
                    side_effect=httpx.HTTPStatusError(
                        "error", request=MagicMock(), response=err_response
                    )
                )
                mock_ctx.get = AsyncMock(return_value=err_response)

                import asyncio
                asyncio.get_event_loop().run_until_complete(svc.get_product_info("X"))

        assert len(caplog.records) > 0
        assert any(r.levelno == logging.WARNING for r in caplog.records)


# ---------------------------------------------------------------------------
# V04 – OzonService: timeout is applied to every method
# ---------------------------------------------------------------------------

class TestOzonTimeout:
    def _make_service(self):
        from app.services.ozon import OzonService
        return OzonService("client-123", "api-key-xyz")

    @pytest.mark.asyncio
    async def test_get_product_info_passes_timeout(self):
        from app.services.ozon import _TIMEOUT
        svc = self._make_service()
        response = _make_response(200, {"result": {"name": "Product"}})

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            mock_ctx.post = AsyncMock(return_value=response)

            await svc.get_product_info("ART-001")
            call_kwargs = mock_client_cls.call_args
            assert call_kwargs.kwargs.get("timeout") == _TIMEOUT

    @pytest.mark.asyncio
    async def test_get_product_prices_passes_timeout(self):
        from app.services.ozon import _TIMEOUT
        svc = self._make_service()
        response = _make_response(200, {"result": {"items": [{"offer_id": "A"}]}})

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            mock_ctx.post = AsyncMock(return_value=response)

            await svc.get_product_prices("ART-001")
            call_kwargs = mock_client_cls.call_args
            assert call_kwargs.kwargs.get("timeout") == _TIMEOUT

    @pytest.mark.asyncio
    async def test_timeout_values(self):
        from app.services.ozon import _TIMEOUT
        assert _TIMEOUT.read == 15.0
        assert _TIMEOUT.connect == 5.0

    @pytest.mark.asyncio
    async def test_http_error_returns_none(self):
        svc = self._make_service()
        err_response = _make_response(429)

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            err_response.raise_for_status = MagicMock(
                side_effect=httpx.HTTPStatusError(
                    "rate limited", request=MagicMock(), response=err_response
                )
            )
            mock_ctx.post = AsyncMock(return_value=err_response)

            result = await svc.get_product_info("BAD")
            assert result is None


# ---------------------------------------------------------------------------
# V07 – Ozon get_product_list: cursor-based pagination
# ---------------------------------------------------------------------------

class TestOzonPaginationV07:
    def _make_service(self):
        from app.services.ozon import OzonService
        return OzonService("cid", "akey")

    @pytest.mark.asyncio
    async def test_fetches_all_pages_using_cursor(self):
        """When last_id is returned, a second request must be made with it."""
        svc = self._make_service()
        page1 = _make_response(200, {
            "result": {
                "items": [{"offer_id": f"P{i}"} for i in range(100)],
                "last_id": "cursor-abc",
                "total": 150,
            }
        })
        page2 = _make_response(200, {
            "result": {
                "items": [{"offer_id": f"P{i}"} for i in range(100, 150)],
                "last_id": "",
                "total": 150,
            }
        })

        call_count = 0

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            async def _multi_page_post(url, **kwargs):
                nonlocal call_count
                call_count += 1
                body = kwargs.get("json", {})
                if body.get("last_id", "") == "":
                    return page1
                return page2

            mock_ctx.post = _multi_page_post

            result = await svc.get_product_list(page_size=100)

        assert call_count == 2, f"Expected 2 API calls (2 pages), got {call_count}"
        assert result is not None
        assert len(result) == 150

    @pytest.mark.asyncio
    async def test_single_page_when_no_cursor(self):
        svc = self._make_service()
        page = _make_response(200, {
            "result": {
                "items": [{"offer_id": "P1"}, {"offer_id": "P2"}],
                "last_id": "",
                "total": 2,
            }
        })

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            mock_ctx.post = AsyncMock(return_value=page)

            result = await svc.get_product_list()

        assert result == [{"offer_id": "P1"}, {"offer_id": "P2"}]

    @pytest.mark.asyncio
    async def test_max_pages_cap_is_respected(self):
        """Pagination must stop at max_pages even if more pages exist."""
        svc = self._make_service()

        def _always_has_next(url, **kwargs):
            # Return 10 items and always indicate more
            resp = _make_response(200, {
                "result": {
                    "items": [{"offer_id": "X"}] * 10,
                    "last_id": "always-more",
                    "total": 9999,
                }
            })
            coro = AsyncMock(return_value=resp)
            return coro()

        call_count = 0

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            async def _count(url, **kwargs):
                nonlocal call_count
                call_count += 1
                return _make_response(200, {
                    "result": {
                        "items": [{"offer_id": "X"}] * 10,
                        "last_id": "more",
                        "total": 9999,
                    }
                })

            mock_ctx.post = _count

            result = await svc.get_product_list(page_size=10, max_pages=3)

        assert call_count == 3, f"Should cap at max_pages=3, made {call_count} calls"
        assert result is not None
        assert len(result) == 30

    @pytest.mark.asyncio
    async def test_empty_result_returns_none(self):
        svc = self._make_service()
        page = _make_response(200, {
            "result": {"items": [], "last_id": "", "total": 0}
        })

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_ctx = AsyncMock()
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
            mock_ctx.post = AsyncMock(return_value=page)

            result = await svc.get_product_list()

        assert result is None


# ---------------------------------------------------------------------------
# V11 – OzonService: logging instead of print
# ---------------------------------------------------------------------------

class TestOzonLogging:
    def test_no_print_in_source(self):
        import ast, pathlib
        src = pathlib.Path("app/services/ozon.py").read_text()
        tree = ast.parse(src)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                func = node.func
                if isinstance(func, ast.Name) and func.id == "print":
                    pytest.fail(f"Found bare print() at line {node.lineno} in ozon.py")

    def test_warning_logged_on_http_error(self, caplog):
        from app.services.ozon import OzonService
        svc = OzonService("cid", "key")
        err_response = _make_response(401)

        with caplog.at_level(logging.WARNING, logger="app.services.ozon"):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_ctx = AsyncMock()
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_ctx)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
                err_response.raise_for_status = MagicMock(
                    side_effect=httpx.HTTPStatusError(
                        "unauth", request=MagicMock(), response=err_response
                    )
                )
                mock_ctx.post = AsyncMock(return_value=err_response)

                import asyncio
                asyncio.get_event_loop().run_until_complete(svc.get_product_info("X"))

        assert any(r.levelno == logging.WARNING for r in caplog.records)
