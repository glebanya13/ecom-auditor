"""
Audit Log model
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class AuditLog(Base):
    """Audit Log model - stores audit history and scoring"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    # Audit metadata
    audit_type = Column(String(50), nullable=False)  # 'quick', 'full', 'scheduled'
    audit_date = Column(DateTime(timezone=True), server_default=func.now())

    # Scoring (0-100)
    total_score = Column(Float, nullable=False, default=0.0)
    legal_score = Column(Float, nullable=True)  # Max 40 points
    delivery_score = Column(Float, nullable=True)  # Max 30 points
    seo_score = Column(Float, nullable=True)  # Max 20 points
    price_score = Column(Float, nullable=True)  # Max 10 points

    # Detailed results
    risks_detected = Column(JSON, nullable=True)  # Array of risk objects
    """
    Example: [
        {
            "type": "certificate_expired",
            "severity": "high",
            "description": "Certificate status is 'Suspended'",
            "recommendation": "Contact certification body immediately"
        }
    ]
    """

    issues_summary = Column(Text, nullable=True)  # Human-readable summary
    recommendations = Column(JSON, nullable=True)  # Array of recommendations

    # Compliance checks
    certificate_check_passed = Column(Integer, default=False)  # Boolean as int
    marking_check_passed = Column(Integer, default=False)
    seo_check_passed = Column(Integer, default=False)
    delivery_check_passed = Column(Integer, default=False)

    # Financial analysis
    margin_percentage = Column(Float, nullable=True)
    estimated_profit = Column(Float, nullable=True)
    vat_amount = Column(Float, nullable=True)

    # Report generation
    report_generated = Column(Integer, default=False)  # Boolean as int
    report_pdf_path = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    product = relationship("Product", back_populates="audit_logs")
