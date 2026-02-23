"""
User model
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class User(Base):
    """User model - stores user accounts and API keys"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String(100), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)

    # Encrypted API keys for marketplaces
    wb_api_key = Column(Text, nullable=True)  # Encrypted Wildberries API key
    ozon_client_id = Column(String(255), nullable=True)
    ozon_api_key = Column(Text, nullable=True)  # Encrypted Ozon API key

    # Subscription and balance
    balance = Column(Float, default=0.0)
    subscription_active = Column(Boolean, default=False)
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    products = relationship("Product", back_populates="owner", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    legal_docs = relationship("LegalDoc", back_populates="user", cascade="all, delete-orphan")
