"""
Products API endpoints
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ..core.database import get_db, SessionLocal
from ..models.user import User
from ..models.product import Product
from ..schemas.product import ProductCreate, ProductResponse, ProductUpdate
from .auth import get_current_user
from ..core.security import decrypt_api_key

logger = logging.getLogger(__name__)
router = APIRouter()


class ValidateSkuRequest(BaseModel):
    sku_id: str
    marketplace: str  # "wildberries" | "ozon"


class ValidateSkuResponse(BaseModel):
    valid: bool
    name: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    message: Optional[str] = None


class ImportProductsRequest(BaseModel):
    marketplace: str  # "wildberries" | "ozon"


class ImportProductsResponse(BaseModel):
    imported: int
    skipped: int
    total: int
    message: str


@router.post("/validate", response_model=ValidateSkuResponse)
async def validate_sku(
    data: ValidateSkuRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Check if a SKU exists on the specified marketplace before adding it.
    WB: uses public catalog API (no key needed).
    Ozon: uses Seller API with user credentials; if no key — skips check and returns valid=True.
    """
    sku = data.sku_id.strip()
    marketplace = data.marketplace.lower()

    if marketplace == "wildberries":
        # Get user's WB key
        wb_api_key = None
        if current_user.wb_api_key:
            try:
                wb_api_key = decrypt_api_key(current_user.wb_api_key)
            except Exception:
                pass
        if not wb_api_key:
            from ..core.config import settings
            wb_api_key = settings.WILDBERRIES_API_KEY

        if not wb_api_key:
            return ValidateSkuResponse(
                valid=False,
                message="Для проверки товара необходимо настроить WB API ключ в разделе Настройки."
            )

        from ..services.wildberries import WildberriesService
        wb = WildberriesService(wb_api_key)
        info = await wb.check_sku_exists(sku)

        if info is None:
            return ValidateSkuResponse(
                valid=False,
                message=f"Товар с nmId «{sku}» не найден на Wildberries"
            )
        # _no_auth means key is invalid/expired
        if info.get("_no_auth"):
            return ValidateSkuResponse(
                valid=False,
                message="WB API ключ недействителен или истёк. Обновите ключ в разделе Настройки."
            )
        # Remove internal field before returning
        info.pop("_no_auth", None)
        info.pop("nm_id", None)
        return ValidateSkuResponse(valid=True, **info)

    elif marketplace == "ozon":
        # Get user's Ozon credentials
        ozon_client_id = current_user.ozon_client_id
        ozon_api_key = None
        if current_user.ozon_api_key:
            try:
                ozon_api_key = decrypt_api_key(current_user.ozon_api_key)
            except Exception:
                pass

        # Fall back to global keys
        if not (ozon_client_id and ozon_api_key):
            from ..core.config import settings
            ozon_client_id = settings.OZON_CLIENT_ID
            ozon_api_key = settings.OZON_API_KEY

        if not (ozon_client_id and ozon_api_key):
            # No credentials — skip live check, allow adding with a notice
            return ValidateSkuResponse(
                valid=True,
                message="Ozon API ключ не настроен — товар добавлен без проверки. Данные обновятся после настройки ключей в разделе Настройки."
            )

        from ..services.ozon import OzonService
        ozon = OzonService(ozon_client_id, ozon_api_key)
        info = await ozon.check_sku_exists(sku)
        if info is None:
            # Ozon Seller API only returns products from the seller's own catalog.
            # If not found — allow adding anyway; background task will fetch data.
            return ValidateSkuResponse(
                valid=True,
                message="Товар не найден в вашем каталоге Ozon — возможно, артикул от другого продавца. Данные загрузятся автоматически после добавления."
            )
        return ValidateSkuResponse(valid=True, **info)

    else:
        raise HTTPException(status_code=400, detail="Неизвестный маркетплейс")


async def fetch_marketplace_data(
    product_id: int,
    marketplace: str,
    sku_id: str,
    user_wb_api_key: Optional[str],
    user_ozon_client_id: Optional[str],
    user_ozon_api_key: Optional[str],
):
    """Background task: fetch product data from marketplace after adding.

    Uses its own DB session (V03 – request-scope session is closed by the
    time the background task runs).
    """
    db = SessionLocal()
    try:
        updates: dict = {}

        if marketplace == "wildberries":
            wb_api_key = None
            if user_wb_api_key:
                try:
                    wb_api_key = decrypt_api_key(user_wb_api_key)
                except Exception:
                    pass
            if not wb_api_key:
                from ..core.config import settings
                wb_api_key = settings.WILDBERRIES_API_KEY

            if wb_api_key:
                from ..services.wildberries import WildberriesService
                wb = WildberriesService(wb_api_key)
                product_info = await wb.get_product_info(sku_id)
                price_info = await wb.get_product_prices(sku_id)

                if product_info:
                    if product_info.get("title"):
                        updates["name"] = product_info["title"]
                    if product_info.get("description"):
                        updates["description"] = product_info["description"]
                    cert_num = wb.extract_certificate_number(product_info)
                    if cert_num:
                        updates["certificate_number"] = cert_num

                if price_info:
                    price = price_info.get("price") or price_info.get("salePriceU")
                    if price and price > 100:
                        updates["current_price"] = price / 100 if price > 10000 else price

        elif marketplace == "ozon":
            ozon_client_id = user_ozon_client_id
            ozon_api_key = None
            if user_ozon_api_key:
                try:
                    ozon_api_key = decrypt_api_key(user_ozon_api_key)
                except Exception:
                    pass
            if not (ozon_client_id and ozon_api_key):
                from ..core.config import settings
                ozon_client_id = settings.OZON_CLIENT_ID
                ozon_api_key = settings.OZON_API_KEY

            if ozon_client_id and ozon_api_key:
                from ..services.ozon import OzonService
                ozon = OzonService(ozon_client_id, ozon_api_key)
                product_info = await ozon.get_product_info(sku_id)
                price_info = await ozon.get_product_prices(sku_id)

                if product_info:
                    if product_info.get("name"):
                        updates["name"] = product_info["name"]
                    if product_info.get("description_category_id"):
                        updates["description"] = product_info.get("description", "")
                    cert_num = ozon.extract_certificate_number(product_info)
                    if cert_num:
                        updates["certificate_number"] = cert_num

                if price_info:
                    price = price_info.get("price", {}).get("price")
                    if price:
                        try:
                            updates["current_price"] = float(price)
                        except (ValueError, TypeError):
                            pass

        updates["last_checked"] = datetime.utcnow()
        db.query(Product).filter(Product.id == product_id).update(updates)
        db.commit()

    except Exception:
        logger.exception("Background marketplace fetch error for product_id=%s", product_id)
    finally:
        db.close()  # V03 – always close the background-owned session


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def add_product(
    product_data: ProductCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add new product for monitoring"""

    # Check if product already exists for this user
    existing = db.query(Product).filter(
        Product.user_id == current_user.id,
        Product.sku_id == product_data.sku_id,
        Product.marketplace == product_data.marketplace
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already exists in your account"
        )

    # Create new product
    new_product = Product(
        user_id=current_user.id,
        sku_id=product_data.sku_id,
        marketplace=product_data.marketplace,
        name=product_data.name
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    # Fetch data from marketplace in background (pass raw encrypted key strings, not
    # the request-scoped db session, to avoid V03-style session leaks)
    background_tasks.add_task(
        fetch_marketplace_data,
        new_product.id,
        product_data.marketplace,
        product_data.sku_id,
        current_user.wb_api_key,
        current_user.ozon_client_id,
        current_user.ozon_api_key,
    )

    return new_product


@router.post("/{product_id}/refresh", response_model=ProductResponse)
async def refresh_product(
    product_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually refresh product data from marketplace"""

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    background_tasks.add_task(
        fetch_marketplace_data,
        product.id,
        product.marketplace,
        product.sku_id,
        current_user.wb_api_key,
        current_user.ozon_client_id,
        current_user.ozon_api_key,
    )

    return product


@router.get("", response_model=List[ProductResponse])
@router.get("/", response_model=List[ProductResponse], include_in_schema=False)
async def get_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    marketplace: str = None
):
    """Get all user's products"""

    query = db.query(Product).filter(Product.user_id == current_user.id)

    if marketplace:
        query = query.filter(Product.marketplace == marketplace)

    products = query.order_by(Product.created_at.desc()).all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific product"""

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update product information"""

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Update fields
    update_data = product_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


@router.post("/import", response_model=ImportProductsResponse)
async def import_products(
    data: ImportProductsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bulk-import all products from user's marketplace catalog into monitoring.

    Skips products already tracked (same user_id + sku_id + marketplace).
    """
    marketplace = data.marketplace.lower()

    # ── Wildberries ──────────────────────────────────────────────────────────
    if marketplace == "wildberries":
        wb_api_key = None
        if current_user.wb_api_key:
            try:
                wb_api_key = decrypt_api_key(current_user.wb_api_key)
            except Exception:
                pass
        if not wb_api_key:
            from ..core.config import settings
            wb_api_key = settings.WILDBERRIES_API_KEY

        if not wb_api_key:
            raise HTTPException(
                status_code=400,
                detail="Wildberries API ключ не настроен. Добавьте ключ в разделе Настройки."
            )

        from ..services.wildberries import WildberriesService
        wb = WildberriesService(wb_api_key)
        goods = await wb.get_product_list()

        # Auth error sentinel
        if goods == WildberriesService._AUTH_ERROR:
            raise HTTPException(
                status_code=400,
                detail="Wildberries API ключ недействителен или истёк. Обновите ключ в разделе Настройки."
            )

        if goods is None or len(goods) == 0:
            return ImportProductsResponse(
                imported=0, skipped=0, total=0,
                message="Товары не найдены в вашем магазине Wildberries"
            )

        imported = skipped = 0
        for item in goods:
            sku_id = str(item.get("nmID", "")).strip()
            if not sku_id:
                continue

            exists = db.query(Product).filter(
                Product.user_id == current_user.id,
                Product.sku_id == sku_id,
                Product.marketplace == "wildberries",
            ).first()
            if exists:
                skipped += 1
                continue

            sizes = item.get("sizes", [])
            price = None
            if sizes:
                price = sizes[0].get("discountedPrice") or sizes[0].get("price")

            vendor_code = item.get("vendorCode", "")
            name = vendor_code or f"WB-{sku_id}"

            db.add(Product(
                user_id=current_user.id,
                sku_id=sku_id,
                marketplace="wildberries",
                name=name,
                current_price=float(price) if price else None,
            ))
            imported += 1

        db.commit()
        return ImportProductsResponse(
            imported=imported, skipped=skipped, total=imported + skipped,
            message=f"Импортировано {imported} товаров, пропущено {skipped} (уже в мониторинге)"
        )

    # ── Ozon ─────────────────────────────────────────────────────────────────
    elif marketplace == "ozon":
        ozon_client_id = current_user.ozon_client_id
        ozon_api_key = None
        if current_user.ozon_api_key:
            try:
                ozon_api_key = decrypt_api_key(current_user.ozon_api_key)
            except Exception:
                pass
        if not (ozon_client_id and ozon_api_key):
            from ..core.config import settings
            ozon_client_id = settings.OZON_CLIENT_ID
            ozon_api_key = settings.OZON_API_KEY

        if not (ozon_client_id and ozon_api_key):
            raise HTTPException(
                status_code=400,
                detail="Ozon Client ID и API ключ не настроены. Добавьте ключи в разделе Настройки."
            )

        from ..services.ozon import OzonService
        ozon = OzonService(ozon_client_id, ozon_api_key)
        goods = await ozon.get_product_list()

        # Auth error sentinel
        if goods == OzonService._AUTH_ERROR:
            raise HTTPException(
                status_code=400,
                detail="Ozon API ключ недействителен или истёк. Обновите ключ в разделе Настройки."
            )

        if goods is None or len(goods) == 0:
            return ImportProductsResponse(
                imported=0, skipped=0, total=0,
                message="Товары не найдены в вашем магазине Ozon"
            )

        imported = skipped = 0
        for item in goods:
            sku_id = (item.get("offer_id") or str(item.get("product_id", ""))).strip()
            if not sku_id:
                continue

            exists = db.query(Product).filter(
                Product.user_id == current_user.id,
                Product.sku_id == sku_id,
                Product.marketplace == "ozon",
            ).first()
            if exists:
                skipped += 1
                continue

            db.add(Product(
                user_id=current_user.id,
                sku_id=sku_id,
                marketplace="ozon",
                name=item.get("name") or f"Ozon-{sku_id}",
            ))
            imported += 1

        db.commit()
        return ImportProductsResponse(
            imported=imported, skipped=skipped, total=imported + skipped,
            message=f"Импортировано {imported} товаров, пропущено {skipped} (уже в мониторинге)"
        )

    else:
        raise HTTPException(status_code=400, detail="Неизвестный маркетплейс")


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete product"""

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    return None
