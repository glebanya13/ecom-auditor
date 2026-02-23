"""
Ozon API integration service
"""
import logging
from typing import Optional, Dict, Any, List

import httpx

logger = logging.getLogger(__name__)

# Default timeout for all requests (V04)
_TIMEOUT = httpx.Timeout(15.0, connect=5.0)


class OzonService:
    """Service for Ozon API integration."""

    BASE_URL = "https://api-seller.ozon.ru"

    def __init__(self, client_id: str, api_key: str) -> None:
        self.client_id = client_id
        self.api_key = api_key
        self.headers = {
            "Client-Id": client_id,
            "Api-Key": api_key,
            "Content-Type": "application/json",
        }

    async def get_product_info(self, sku_id: str) -> Optional[Dict[str, Any]]:
        """Get product information by SKU/Article."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v2/product/info",
                    headers=self.headers,
                    json={"offer_id": sku_id},
                )
                response.raise_for_status()
                return response.json().get("result")
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "Ozon get_product_info HTTP %s for sku=%s", exc.response.status_code, sku_id
                )
                return None
            except Exception:
                logger.exception("Ozon get_product_info unexpected error for sku=%s", sku_id)
                return None

    # Sentinel value returned when API credentials are invalid
    _AUTH_ERROR = "__auth_error__"

    async def get_product_list(
        self,
        *,
        page_size: int = 100,
        max_pages: int = 10,
    ):
        """Fetch all seller products using cursor-based pagination.

        Returns:
            List[Dict] — list of product items (may be empty list if store is empty).
            "__auth_error__" sentinel string — if credentials are rejected by Ozon API.
            None — on unexpected errors.

        Args:
            page_size: Items per page (max 1000 per Ozon docs, but 100 is safer).
            max_pages: Hard cap on pages to prevent runaway fetches.
        """
        all_items: list[Dict[str, Any]] = []
        last_id = ""

        for page in range(max_pages):
            payload: Dict[str, Any] = {
                "filter": {},
                "limit": page_size,
                "last_id": last_id,
            }

            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
                try:
                    response = await client.post(
                        f"{self.BASE_URL}/v3/product/list",
                        headers=self.headers,
                        json=payload,
                    )
                except Exception:
                    logger.exception("Ozon get_product_list unexpected error page=%d", page)
                    break

            # Auth / permission errors → return sentinel so callers can show proper message
            if response.status_code in (401, 403):
                logger.warning("Ozon get_product_list: auth error %s", response.status_code)
                return self._AUTH_ERROR

            # Ozon returns code=5 in JSON body even on 200 for bad keys sometimes
            try:
                data = response.json()
            except Exception:
                logger.warning("Ozon get_product_list: non-JSON response page=%d", page)
                break

            # Check for API-level auth error (code 5 = invalid API key)
            if data.get("code") == 5 or "Invalid Api-Key" in str(data.get("message", "")):
                logger.warning("Ozon get_product_list: invalid API key (code=5)")
                return self._AUTH_ERROR

            if not response.ok:
                logger.warning(
                    "Ozon get_product_list HTTP %s page=%d body=%s",
                    response.status_code, page, response.text[:200],
                )
                break

            result = data.get("result", {})
            items = result.get("items", [])
            all_items.extend(items)

            last_id = result.get("last_id", "")
            total = result.get("total", 0)

            # Stop when we have all items or the page was not full
            if not last_id or len(items) < page_size or len(all_items) >= total:
                break

        return all_items  # empty list = store is empty (not an error)

    async def get_product_prices(self, sku_id: str) -> Optional[Dict[str, Any]]:
        """Get product pricing information."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v4/product/info/prices",
                    headers=self.headers,
                    json={"filter": {"offer_id": [sku_id]}, "limit": 1},
                )
                response.raise_for_status()
                items = response.json().get("result", {}).get("items", [])
                return items[0] if items else None
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "Ozon get_product_prices HTTP %s for sku=%s", exc.response.status_code, sku_id
                )
                return None
            except Exception:
                logger.exception("Ozon get_product_prices unexpected error for sku=%s", sku_id)
                return None

    async def get_product_stocks(self, sku_id: str) -> Optional[Dict[str, Any]]:
        """Get product stock information."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v3/product/info/stocks",
                    headers=self.headers,
                    json={"filter": {"offer_id": [sku_id]}, "limit": 1},
                )
                response.raise_for_status()
                items = response.json().get("result", {}).get("items", [])
                return items[0] if items else None
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "Ozon get_product_stocks HTTP %s for sku=%s", exc.response.status_code, sku_id
                )
                return None
            except Exception:
                logger.exception("Ozon get_product_stocks unexpected error for sku=%s", sku_id)
                return None

    async def get_product_analytics(
        self, sku_id: str, date_from: str, date_to: str
    ) -> Optional[Dict[str, Any]]:
        """Get product analytics data."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v1/analytics/data",
                    headers=self.headers,
                    json={
                        "date_from": date_from,
                        "date_to": date_to,
                        "metrics": ["revenue", "orders_count", "returns_count"],
                        "dimension": ["sku"],
                        "filters": [{"key": "offer_id", "value": sku_id}],
                    },
                )
                response.raise_for_status()
                return response.json().get("result")
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "Ozon get_product_analytics HTTP %s for sku=%s",
                    exc.response.status_code, sku_id,
                )
                return None
            except Exception:
                logger.exception("Ozon get_product_analytics unexpected error for sku=%s", sku_id)
                return None

    async def get_product_rating(self, product_id: int) -> Optional[Dict[str, Any]]:
        """Get product rating and reviews."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.post(
                    f"{self.BASE_URL}/v1/product/rating-by-sku",
                    headers=self.headers,
                    json={"products": [product_id]},
                )
                response.raise_for_status()
                products = response.json().get("products", [])
                return products[0] if products else None
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "Ozon get_product_rating HTTP %s for product_id=%s",
                    exc.response.status_code, product_id,
                )
                return None
            except Exception:
                logger.exception("Ozon get_product_rating unexpected error for product_id=%s", product_id)
                return None

    async def _fetch_product_info(
        self, client: httpx.AsyncClient, payload: dict, sku_id: str
    ) -> Optional[Dict[str, Any]]:
        """Internal helper: POST /v2/product/info and extract result dict."""
        try:
            response = await client.post(
                f"{self.BASE_URL}/v2/product/info",
                headers=self.headers,
                json=payload,
            )
            if response.status_code not in (200, 201):
                return None
            result = response.json().get("result")
            if not result:
                return None
            return result
        except Exception:
            logger.exception(
                "Ozon _fetch_product_info unexpected error payload=%s sku=%s", payload, sku_id
            )
            return None

    async def check_sku_exists(self, sku_id: str) -> Optional[Dict[str, Any]]:
        """Check if a product exists on Ozon.

        Tries both offer_id (seller article) and product_id (numeric Ozon URL id)
        so that users can paste either format.  Returns basic product info dict
        on success, None if not found.
        """
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            # Try as seller offer_id first (text article)
            result = await self._fetch_product_info(
                client, {"offer_id": sku_id}, sku_id
            )

            # If not found and input looks numeric, retry as Ozon product_id
            if result is None and sku_id.strip().lstrip("-").isdigit():
                result = await self._fetch_product_info(
                    client, {"product_id": int(sku_id)}, sku_id
                )

            if result is None:
                return None

            return {
                "name": result.get("name", ""),
                "price": result.get("price"),
                "rating": result.get("rating"),
            }

    def extract_certificate_number(self, product_data: Dict[str, Any]) -> Optional[str]:
        """Extract certificate/declaration number from product data."""
        try:
            if "attributes" in product_data:
                for attr in product_data["attributes"]:
                    if "сертификат" in attr.get("attribute_name", "").lower():
                        return attr.get("values", [{}])[0].get("value")
            return None
        except Exception:
            logger.exception("Ozon extract_certificate_number failed")
            return None
