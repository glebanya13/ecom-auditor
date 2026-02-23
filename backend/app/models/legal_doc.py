"""
Legal Document model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class LegalDoc(Base):
    """Legal Document model - stores generated legal documents and templates"""
    __tablename__ = "legal_docs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Document metadata
    doc_type = Column(String(100), nullable=False)  # 'complaint', 'claim', 'response'
    title = Column(String(500), nullable=False)
    marketplace = Column(String(50), nullable=True)  # 'wildberries', 'ozon', or null

    # Document content
    content = Column(Text, nullable=False)  # Full document text
    template_used = Column(String(100), nullable=True)  # Template identifier

    # Case details
    case_details = Column(JSON, nullable=True)
    """
    Example: {
        "article": "SKU123456",
        "violation_date": "2026-01-15",
        "violation_type": "unauthorized_penalty",
        "penalty_amount": 5000,
        "marketplace_name": "ООО Вайлдберриз"
    }
    """

    # Document status
    status = Column(String(50), default='draft')  # 'draft', 'sent', 'response_received'
    sent_at = Column(DateTime(timezone=True), nullable=True)
    response_received_at = Column(DateTime(timezone=True), nullable=True)

    # Files
    pdf_path = Column(Text, nullable=True)
    attachments = Column(JSON, nullable=True)  # Array of file paths

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="legal_docs")
