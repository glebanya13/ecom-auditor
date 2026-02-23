"""
Audit schemas for API validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class RiskItem(BaseModel):
    """Single risk item"""
    type: str
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    description: str
    recommendation: str


class AuditScores(BaseModel):
    """Detailed scoring breakdown"""
    total_score: float = Field(..., ge=0, le=100)
    legal_score: Optional[float] = Field(None, ge=0, le=40)
    delivery_score: Optional[float] = Field(None, ge=0, le=30)
    seo_score: Optional[float] = Field(None, ge=0, le=20)
    price_score: Optional[float] = Field(None, ge=0, le=10)


class AuditRequest(BaseModel):
    """Request for full audit"""
    product_id: int
    audit_type: str = Field(default="full", pattern="^(quick|full|scheduled)$")


class AuditResponse(BaseModel):
    """Audit result response"""
    id: int
    product_id: Optional[int]
    audit_type: str
    audit_date: datetime

    # Scores
    scores: AuditScores

    # Results
    risks_detected: List[RiskItem]
    issues_summary: Optional[str]
    recommendations: Optional[List[str]]

    # Checks
    certificate_check_passed: bool
    marking_check_passed: bool
    seo_check_passed: bool
    delivery_check_passed: bool

    # Financial
    margin_percentage: Optional[float]
    estimated_profit: Optional[float]
    vat_amount: Optional[float]

    # Report
    report_generated: bool
    report_pdf_path: Optional[str]

    class Config:
        from_attributes = True


class FinancialCalculation(BaseModel):
    """Financial calculation request"""
    product_price: float = Field(..., gt=0)
    cost_price: float = Field(..., gt=0)
    logistics_cost: float = Field(default=0)
    marketplace_commission: float = Field(..., ge=0, le=100)
    return_rate: float = Field(default=0, ge=0, le=100)
    include_vat: bool = Field(default=True)


class FinancialResult(BaseModel):
    """Financial calculation result"""
    gross_revenue: float
    marketplace_fee: float
    vat_amount: float
    logistics_cost: float
    return_losses: float
    net_profit: float
    margin_percentage: float
    effective_margin_percentage: float  # After VAT and returns
