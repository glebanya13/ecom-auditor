"""
Wildberries API integration service
"""
import logging
from datetime import date
from typing import Optional, Dict, Any, List

import httpx

from ..core.config import settings

logger = logging.getLogger(__name__)

# Default timeout for all requests (V04)
_TIMEOUT = httpx.Timeout(15.0, connect=5.0)


class WildberriesService:
    """Service for Wildberries API integration."""

    BASE_URL = "https://suppliers-api.wildberries.ru"
    CONTENT_URL = "https://content-api.wildberries.ru"
    STATS_URL = "https://statistics-api.wildberries.ru"

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.headers = {
            "Authorization": api_key,
            "Content-Type": "application/json",
        }

    async def get_product_info(self, sku_id: str) -> Optional[Dict[str, Any]]:
        """Get product information by SKU."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.get(
                    f"{self.CONTENT_URL}/content/v1/cards/filter",
                    headers=self.headers,
                    params={"vendorCode": sku_id},
                )
                response.raise_for_status()
                data = response.json()
                if data and "data" in data and len(data["data"]) > 0:
                    return data["data"][0]
                return None
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "WB get_product_info HTTP %s for sku=%s", exc.response.status_code, sku_id
                )
                return None
            except Exception:
                logger.exception("WB get_product_info unexpected error for sku=%s", sku_id)
                return None

    async def get_product_prices(self, sku_id: str) -> Optional[Dict[str, Any]]:
        """Get product pricing information."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.get(
                    f"{self.BASE_URL}/public/api/v1/info",
                    headers=self.headers,
                    params={"quantity": 1},
                )
                response.raise_for_status()
                prices = response.json()
                for item in prices:
                    if item.get("vendorCode") == sku_id:
                        return item
                return None
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "WB get_product_prices HTTP %s for sku=%s", exc.response.status_code, sku_id
                )
                return None
            except Exception:
                logger.exception("WB get_product_prices unexpected error for sku=%s", sku_id)
                return None

    async def get_product_statistics(
        self, sku_id: str, date_from: str, date_to: str
    ) -> Optional[List[Dict]]:
        """Get product statistics (sales, views, positions)."""
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.get(
                    f"{self.STATS_URL}/api/v1/supplier/reportDetailByPeriod",
                    headers=self.headers,
                    params={"dateFrom": date_from, "dateTo": date_to},
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "WB get_product_statistics HTTP %s for sku=%s", exc.response.status_code, sku_id
                )
                return None
            except Exception:
                logger.exception("WB get_product_statistics unexpected error for sku=%s", sku_id)
                return None

    # Sentinel value returned when API credentials are invalid
    _AUTH_ERROR = "__auth_error__"

    async def get_product_list(
        self,
        *,
        page_size: int = 1000,
        max_pages: int = 20,
    ):
        """Fetch all seller products via the Discounts/Prices API.

        Returns:
            List[Dict] — list of goods dicts (may be empty list if store has no products).
            "__auth_error__" sentinel — if WB API key is invalid/expired (401).
            None — on unexpected errors.

        Each item has keys: nmID, vendorCode, sizes (with prices).
        Uses offset-based pagination. max_pages * page_size = hard cap.
        """
        all_items: list[Dict[str, Any]] = []
        offset = 0

        for _ in range(max_pages):
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                try:
                    response = await client.get(
                        "https://discounts-prices-api.wildberries.ru/api/v2/list/goods/filter",
                        headers=self.headers,
                        params={"limit": page_size, "offset": offset},
                    )
                except Exception:
                    logger.exception("WB get_product_list unexpected error offset=%d", offset)
                    break

            if response.status_code == 401:
                logger.warning("WB get_product_list: 401 Unauthorized — invalid API key")
                return self._AUTH_ERROR

            if not response.is_success:
                logger.warning(
                    "WB get_product_list HTTP %s offset=%d", response.status_code, offset
                )
                break

            try:
                data = response.json()
            except Exception:
                logger.warning("WB get_product_list: non-JSON response offset=%d", offset)
                break

            items = data.get("data", {}).get("listGoods", [])
            if not items:
                break
            all_items.extend(items)

            if len(items) < page_size:
                break  # Last page
            offset += page_size

        return all_items  # empty list = store is empty (not an error)

    async def get_product_stocks(self, sku_id: str) -> Optional[Dict[str, Any]]:
        """Get product stock information."""
        # V11 – use today's date dynamically instead of a hardcoded value
        date_from = date.today().isoformat()
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.get(
                    f"{self.STATS_URL}/api/v1/supplier/stocks",
                    headers=self.headers,
                    params={"dateFrom": date_from},
                )
                response.raise_for_status()
                stocks = response.json()
                for item in stocks:
                    if item.get("supplierArticle") == sku_id:
                        return item
                return None
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "WB get_product_stocks HTTP %s for sku=%s", exc.response.status_code, sku_id
                )
                return None
            except Exception:
                logger.exception("WB get_product_stocks unexpected error for sku=%s", sku_id)
                return None

    async def search_product_position(self, search_query: str, sku_id: str) -> Optional[int]:
        """Search for product position in search results.

        Note: WB does not provide a direct API for this.  Returns None.
        Production implementations require a third-party service or scraping.
        """
        return None

    async def check_sku_exists(self, sku_id: str) -> Optional[Dict[str, Any]]:
        """Check if a product (nmId) exists on Wildberries using the Seller API.

        Returns basic product info dict on success, None if not found.
        """
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:  # V04
            try:
                response = await client.get(
                    "https://discounts-prices-api.wildberries.ru/api/v2/list/goods/filter",
                    headers=self.headers,
                    params={"limit": 1, "nmId": sku_id},
                )
                if response.status_code == 401:
                    return {"_no_auth": True}
                if response.status_code != 200:
                    return None
                data = response.json()
                items = data.get("data", {}).get("listGoods", [])
                if not items:
                    return None
                item = items[0]
                sizes = item.get("sizes", [])
                price = None
                if sizes:
                    price = sizes[0].get("discountedPrice") or sizes[0].get("price")
                return {
                    "name": "",
                    "brand": "",
                    "price": float(price) if price else None,
                    "rating": None,
                    "nm_id": item.get("nmID"),
                }
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "WB check_sku_exists HTTP %s for sku=%s", exc.response.status_code, sku_id
                )
                return None
            except Exception:
                logger.exception("WB check_sku_exists unexpected error for sku=%s", sku_id)
                return None

    def extract_certificate_number(self, product_data: Dict[str, Any]) -> Optional[str]:
        """Extract certificate/declaration number from product data."""
        try:
            if "nomenclatures" in product_data:
                for nom in product_data["nomenclatures"]:
                    if "addin" in nom:
                        for addin in nom["addin"]:
                            if addin.get("type") in ("Сертификат", "Декларация"):
                                return addin.get("params", [{}])[0].get("value")
            return None
        except Exception:
            logger.exception("WB extract_certificate_number failed")
            return None
