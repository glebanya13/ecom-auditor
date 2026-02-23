"""
Product schemas for API validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProductBase(BaseModel):
    """Base product schema"""
    sku_id: str = Field(..., description="SKU/Article number")
    marketplace: str = Field(..., pattern="^(wildberries|ozon)$")
    name: Optional[str] = None


class ProductCreate(ProductBase):
    """Schema for adding a product"""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating product"""
    name: Optional[str] = None
    certificate_number: Optional[str] = None
    marking_code: Optional[str] = None
    warehouse_location: Optional[str] = None


class ProductResponse(ProductBase):
    """Schema for product response"""
    id: int
    user_id: int
    product_url: Optional[str]

    # Legal compliance
    certificate_number: Optional[str]
    certificate_status: Optional[str]
    marking_code: Optional[str]
    marking_status: Optional[str]

    # Current state
    current_price: Optional[float]
    current_position: Optional[int]
    stock_quantity: Optional[int]
    rating: Optional[float]
    reviews_count: Optional[int]

    # Delivery
    delivery_time_hours: Optional[int]
    warehouse_location: Optional[str]

    # Risk flags
    shadow_ban_detected: bool
    certificate_expired: bool
    marking_issues: bool

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]
    last_checked: Optional[datetime]

    class Config:
        from_attributes = True


class QuickAuditRequest(BaseModel):
    """Request for quick audit (landing page)"""
    sku_id: str = Field(..., description="SKU/Article number")
    marketplace: str = Field(..., pattern="^(wildberries|ozon)$")


class QuickAuditResponse(BaseModel):
    """Quick audit response with 2-3 issues"""
    sku_id: str
    marketplace: str
    issues_found: List[str]
    score: float
    message: str
