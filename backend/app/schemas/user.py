"""
User schemas for API validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: Optional[str] = None
    telegram_id: Optional[str] = None


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for user self-update (profile + API keys + password change)"""
    full_name: Optional[str] = None
    telegram_id: Optional[str] = None
    wb_api_key: Optional[str] = None
    ozon_client_id: Optional[str] = None
    ozon_api_key: Optional[str] = None
    # Password change — requires current password for verification
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8)


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    balance: float
    subscription_active: bool
    subscription_expires_at: Optional[datetime]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[int] = None
    email: Optional[str] = None
