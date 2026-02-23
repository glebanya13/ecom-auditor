"""
Product model
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Product(Base):
    """Product model - stores marketplace products for monitoring"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Product identification
    sku_id = Column(String(255), nullable=False, index=True)  # SKU/Article number
    marketplace = Column(String(50), nullable=False)  # 'wildberries' or 'ozon'
    product_url = Column(Text, nullable=True)
    name = Column(String(500), nullable=True)

    # Legal compliance
    certificate_number = Column(String(255), nullable=True)  # Certificate/Declaration number
    certificate_status = Column(String(50), nullable=True)  # Status from Rosaccreditation
    rosaccreditation_link = Column(Text, nullable=True)  # Link to FGIS Rosaccreditation
    marking_code = Column(String(255), nullable=True)  # Marking code for Chestnyznak
    marking_status = Column(String(50), nullable=True)  # Status from Chestnyznak

    # Current state
    current_price = Column(Float, nullable=True)
    current_position = Column(Integer, nullable=True)  # Position in search
    stock_quantity = Column(Integer, nullable=True)
    rating = Column(Float, nullable=True)
    reviews_count = Column(Integer, nullable=True)

    # SEO data
    seo_keywords = Column(JSON, nullable=True)  # List of keywords in description
    description = Column(Text, nullable=True)

    # Delivery analysis
    delivery_time_hours = Column(Integer, nullable=True)
    warehouse_location = Column(String(255), nullable=True)

    # History tracking
    position_history = Column(JSON, nullable=True)  # Array of {date, position}
    price_history = Column(JSON, nullable=True)  # Array of {date, price}

    # Risk flags
    shadow_ban_detected = Column(Integer, default=0)  # Boolean as int
    certificate_expired = Column(Integer, default=0)
    marking_issues = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_checked = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="products")
    audit_logs = relationship("AuditLog", back_populates="product", cascade="all, delete-orphan")
