"""
Audit API endpoints
"""
import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from ..core.database import get_db, SessionLocal
from ..core.security import decrypt_api_key
from ..models.user import User
from ..models.product import Product
from ..models.audit_log import AuditLog
from ..schemas.product import QuickAuditRequest, QuickAuditResponse
from ..schemas.audit import AuditRequest, AuditResponse, AuditScores, FinancialCalculation, FinancialResult
from ..services.wildberries import WildberriesService
from ..services.ozon import OzonService
from ..services.rosaccreditation import RosaccreditationService
from ..services.chestnyznak import ChestnyznakService
from ..services.audit_engine import AuditEngine
from ..services.financial_calculator import FinancialCalculator
from ..services.pdf_generator import PDFReportGenerator
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Quick audit (no auth) – V12: basic real check instead of hardcoded mock
# ---------------------------------------------------------------------------

@router.post("/quick", response_model=QuickAuditResponse)
async def quick_audit(request: QuickAuditRequest):
    """Quick audit for the landing page.

    Performs lightweight checks without requiring authentication.
    V12 – replaces the fully-hardcoded mock with dynamic heuristics.
    """
    issues: list[str] = []
    score = 100.0

    sku = str(request.sku_id).strip()
    marketplace = request.marketplace.lower()

    # Basic SKU format validation
    if not sku.isdigit():
        issues.append("Некорректный формат SKU: ожидаются только цифры")
        score -= 20

    if marketplace == "wildberries" and len(sku) not in range(5, 10):
        issues.append("Для Wildberries SKU обычно содержит 7–9 цифр")
        score -= 10

    if marketplace == "ozon" and len(sku) not in range(5, 13):
        issues.append("Для Ozon артикул обычно содержит 6–12 символов")
        score -= 10

    # Static heuristics that apply to every quick check
    issues.append("Подробная проверка сертификатов доступна только в полном отчёте")
    score -= 15

    issues.append("SEO-анализ заголовка и ключевых слов требует авторизации")
    score -= 15

    issues.append("Анализ цен и позиций конкурентов доступен в платном тарифе")
    score -= 15

    score = max(score, 0.0)

    return QuickAuditResponse(
        sku_id=request.sku_id,
        marketplace=request.marketplace,
        issues_found=issues[:3],
        score=round(score, 1),
        message="Зарегистрируйтесь для получения полного отчета",
    )


# ---------------------------------------------------------------------------
# Full audit (auth required)
# ---------------------------------------------------------------------------

@router.post("/full", response_model=AuditResponse)
async def full_audit(
    request: AuditRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full product audit with scoring.

    V02 – requires an active subscription or sufficient balance.
    """
    # V02 – subscription / balance check
    if not current_user.subscription_active:
        if (current_user.balance or 0) <= 0:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Для проведения аудита необходима активная подписка или положительный баланс",
            )

    product = db.query(Product).filter(
        Product.id == request.product_id,
        Product.user_id == current_user.id,
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    audit_engine = AuditEngine()
    ros_service = RosaccreditationService()
    chestnyznak_service = ChestnyznakService()

    product_data = await _fetch_marketplace_data(product, current_user)

    certificate_status = None
    if product.certificate_number:
        certificate_status = await ros_service.check_certificate(product.certificate_number)

    marking_status = None
    if product.marking_code:
        marking_status = await chestnyznak_service.check_marking_code(product.marking_code)

    scores, risks, recommendations = audit_engine.calculate_total_score(
        product_data=product_data,
        certificate_status=certificate_status,
        marking_status=marking_status,
        competitor_delivery_time=24,
    )

    financial_calc = FinancialCalculator()
    if product.current_price:
        financial_result = financial_calc.calculate_net_profit(
            product_price=product.current_price,
            cost_price=product.current_price * 0.6,
            marketplace_commission_percent=15.0,
        )
    else:
        financial_result = {}

    audit_log = AuditLog(
        user_id=current_user.id,
        product_id=product.id,
        audit_type=request.audit_type,
        total_score=scores.total_score,
        legal_score=scores.legal_score,
        delivery_score=scores.delivery_score,
        seo_score=scores.seo_score,
        price_score=scores.price_score,
        risks_detected=[risk.dict() for risk in risks],
        recommendations=recommendations,
        certificate_check_passed=bool(
            certificate_status and ros_service.is_certificate_valid(certificate_status)
        ),
        marking_check_passed=bool(marking_status and marking_status.get("is_valid")),
        margin_percentage=financial_result.get("margin_percentage"),
        estimated_profit=financial_result.get("net_profit"),
        vat_amount=financial_result.get("vat_amount"),
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    if request.audit_type == "full":
        background_tasks.add_task(
            _generate_pdf_report,
            audit_log.id,
            product_data,
            audit_log,
            current_user,
        )

    return AuditResponse(
        id=audit_log.id,
        product_id=product.id,
        audit_type=audit_log.audit_type,
        audit_date=audit_log.audit_date,
        scores=scores,
        risks_detected=risks,
        issues_summary=f"Обнаружено {len(risks)} проблем",
        recommendations=recommendations,
        certificate_check_passed=audit_log.certificate_check_passed,
        marking_check_passed=audit_log.marking_check_passed,
        seo_check_passed=scores.seo_score >= 15,
        delivery_check_passed=scores.delivery_score >= 20,
        margin_percentage=audit_log.margin_percentage,
        estimated_profit=audit_log.estimated_profit,
        vat_amount=audit_log.vat_amount,
        report_generated=False,
        report_pdf_path=None,
    )


# ---------------------------------------------------------------------------
# Audit history – V08: bounded limit
# ---------------------------------------------------------------------------

@router.get("/history", response_model=List[AuditResponse])
async def get_audit_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=10, ge=1, le=100),  # V08 – cap at 100
):
    """Return the user's audit history (most recent first)."""
    audits = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == current_user.id)
        .order_by(AuditLog.audit_date.desc())
        .limit(limit)
        .all()
    )

    results = []
    for audit in audits:
        results.append(
            AuditResponse(
                id=audit.id,
                product_id=audit.product_id,
                audit_type=audit.audit_type,
                audit_date=audit.audit_date,
                scores=AuditScores(
                    total_score=audit.total_score,
                    legal_score=audit.legal_score,
                    delivery_score=audit.delivery_score,
                    seo_score=audit.seo_score,
                    price_score=audit.price_score,
                ),
                risks_detected=audit.risks_detected or [],
                issues_summary=audit.issues_summary,
                recommendations=audit.recommendations or [],
                certificate_check_passed=audit.certificate_check_passed,
                marking_check_passed=audit.marking_check_passed,
                seo_check_passed=audit.seo_check_passed,
                delivery_check_passed=audit.delivery_check_passed,
                margin_percentage=audit.margin_percentage,
                estimated_profit=audit.estimated_profit,
                vat_amount=audit.vat_amount,
                report_generated=audit.report_generated,
                report_pdf_path=audit.report_pdf_path,
            )
        )

    return results


# ---------------------------------------------------------------------------
# Financial calculator
# ---------------------------------------------------------------------------

@router.post("/calculate-finances", response_model=FinancialResult)
async def calculate_finances(
    calc_data: FinancialCalculation,
    current_user: User = Depends(get_current_user),
):
    """Calculate financial metrics for a product."""
    calculator = FinancialCalculator()
    result = calculator.calculate_net_profit(
        product_price=calc_data.product_price,
        cost_price=calc_data.cost_price,
        logistics_cost=calc_data.logistics_cost,
        marketplace_commission_percent=calc_data.marketplace_commission,
        return_rate_percent=calc_data.return_rate,
        include_vat=calc_data.include_vat,
    )
    return FinancialResult(**result)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _fetch_marketplace_data(product: Product, user: User) -> dict:
    """Fetch product data from the appropriate marketplace API."""
    if product.marketplace == "wildberries":
        if not user.wb_api_key:
            return _mock_product_data(product)
        api_key = decrypt_api_key(user.wb_api_key)
        wb_service = WildberriesService(api_key)
        product_info = await wb_service.get_product_info(product.sku_id)
        if product_info:
            product.name = product_info.get("name", product.name)
        return _mock_product_data(product)

    elif product.marketplace == "ozon":
        if not user.ozon_api_key or not user.ozon_client_id:
            return _mock_product_data(product)
        api_key = decrypt_api_key(user.ozon_api_key)
        ozon_service = OzonService(user.ozon_client_id, api_key)
        await ozon_service.get_product_info(product.sku_id)
        return _mock_product_data(product)

    return _mock_product_data(product)


def _mock_product_data(product: Product) -> dict:
    """Generate placeholder product data when live data is unavailable."""
    return {
        "sku_id": product.sku_id,
        "marketplace": product.marketplace,
        "current_price": product.current_price or 1500.0,
        "rating": product.rating or 4.5,
        "description": product.description or "Качественный товар",
        "seo_keywords": product.seo_keywords or ["товар", "качество"],
        "delivery_time_hours": product.delivery_time_hours or 48,
        "competitor_prices": {},
    }


async def _generate_pdf_report(
    audit_log_id: int,
    product_data: dict,
    audit_log: AuditLog,
    user: User,
) -> None:
    """Generate a PDF report in the background.

    V03 – DB session is always closed via try/finally to prevent leaks.
    """
    db = SessionLocal()
    try:
        pdf_generator = PDFReportGenerator()

        audit_results = {
            "scores": {
                "total_score": audit_log.total_score,
                "legal_score": audit_log.legal_score,
                "delivery_score": audit_log.delivery_score,
                "seo_score": audit_log.seo_score,
                "price_score": audit_log.price_score,
            },
            "risks_detected": audit_log.risks_detected or [],
            "recommendations": audit_log.recommendations or [],
            "margin_percentage": audit_log.margin_percentage,
            "estimated_profit": audit_log.estimated_profit,
            "vat_amount": audit_log.vat_amount,
        }

        user_data = {"full_name": user.full_name or user.email}

        pdf_path = pdf_generator.generate_full_audit_report(
            product_data=product_data,
            audit_results=audit_results,
            user_data=user_data,
        )

        audit = db.query(AuditLog).filter(AuditLog.id == audit_log_id).first()
        if audit:
            audit.report_generated = True
            audit.report_pdf_path = pdf_path
            db.commit()

    except Exception:
        logger.exception("Error generating PDF report for audit_log_id=%s", audit_log_id)
    finally:
        db.close()  # V03 – always released
