"""
Financial Calculator - Clean Margin 2026
Calculates profit considering VAT 22%, logistics, and returns
"""
from typing import Dict, Any
from ..core.config import settings


class FinancialCalculator:
    """
    Financial calculator for e-commerce margins
    Includes VAT 22% (2026 rate), logistics costs, and return rates
    """

    VAT_RATE = settings.VAT_RATE  # 0.22 (22%)

    def calculate_net_profit(
        self,
        product_price: float,
        cost_price: float,
        logistics_cost: float = 0.0,
        marketplace_commission_percent: float = 15.0,
        return_rate_percent: float = 5.0,
        include_vat: bool = True
    ) -> Dict[str, float]:
        """
        Calculate net profit with all costs considered

        Args:
            product_price: Selling price
            cost_price: Purchase/production cost
            logistics_cost: Logistics cost per unit
            marketplace_commission_percent: Marketplace commission (%)
            return_rate_percent: Expected return rate (%)
            include_vat: Whether to include VAT calculation

        Returns:
            Dictionary with detailed financial breakdown
        """

        # Step 1: Gross revenue
        gross_revenue = product_price

        # Step 2: Marketplace commission
        marketplace_fee = gross_revenue * (marketplace_commission_percent / 100)

        # Step 3: VAT calculation (if applicable)
        if include_vat:
            # Revenue includes VAT, extract it
            revenue_without_vat = gross_revenue / (1 + self.VAT_RATE)
            vat_amount = gross_revenue - revenue_without_vat
        else:
            revenue_without_vat = gross_revenue
            vat_amount = 0.0

        # Step 4: Calculate base profit
        base_profit = revenue_without_vat - marketplace_fee - cost_price - logistics_cost

        # Step 5: Account for returns
        # Returns reduce effective revenue
        return_losses = gross_revenue * (return_rate_percent / 100)

        # Step 6: Net profit
        net_profit = base_profit - return_losses

        # Step 7: Calculate margins
        if gross_revenue > 0:
            margin_percentage = ((gross_revenue - cost_price) / gross_revenue) * 100
            effective_margin = (net_profit / gross_revenue) * 100
        else:
            margin_percentage = 0.0
            effective_margin = 0.0

        return {
            "gross_revenue": round(gross_revenue, 2),
            "revenue_without_vat": round(revenue_without_vat, 2),
            "vat_amount": round(vat_amount, 2),
            "cost_price": round(cost_price, 2),
            "marketplace_fee": round(marketplace_fee, 2),
            "logistics_cost": round(logistics_cost, 2),
            "return_losses": round(return_losses, 2),
            "net_profit": round(net_profit, 2),
            "margin_percentage": round(margin_percentage, 2),
            "effective_margin_percentage": round(effective_margin, 2),
            "total_costs": round(cost_price + marketplace_fee + logistics_cost + return_losses + vat_amount, 2)
        }

    def calculate_break_even_price(
        self,
        cost_price: float,
        logistics_cost: float = 0.0,
        marketplace_commission_percent: float = 15.0,
        return_rate_percent: float = 5.0,
        include_vat: bool = True,
        target_margin_percent: float = 20.0
    ) -> Dict[str, float]:
        """
        Calculate minimum price needed for target margin
        """

        # Account for all costs
        total_base_cost = cost_price + logistics_cost

        # Factor in commission and returns
        cost_multiplier = 1 / (1 - (marketplace_commission_percent / 100) - (return_rate_percent / 100))

        # Add target margin
        margin_multiplier = 1 + (target_margin_percent / 100)

        # Calculate price before VAT
        price_without_vat = total_base_cost * cost_multiplier * margin_multiplier

        # Add VAT if needed
        if include_vat:
            recommended_price = price_without_vat * (1 + self.VAT_RATE)
        else:
            recommended_price = price_without_vat

        # Break-even price (0% margin)
        breakeven_price = total_base_cost * cost_multiplier
        if include_vat:
            breakeven_price *= (1 + self.VAT_RATE)

        return {
            "recommended_price": round(recommended_price, 2),
            "breakeven_price": round(breakeven_price, 2),
            "target_margin_percent": target_margin_percent,
            "price_without_vat": round(price_without_vat, 2)
        }

    def check_usn_limit_2026(self, annual_revenue: float) -> Dict[str, Any]:
        """
        Check if seller is within USN (simplified tax) limits for 2026
        Current limit: 265.8 million rubles (subject to indexation)
        """
        USN_LIMIT_2026 = 265_800_000  # 265.8M rubles

        within_limit = annual_revenue <= USN_LIMIT_2026
        usage_percent = (annual_revenue / USN_LIMIT_2026) * 100

        remaining = USN_LIMIT_2026 - annual_revenue

        risk_level = "low"
        if usage_percent >= 95:
            risk_level = "critical"
        elif usage_percent >= 85:
            risk_level = "high"
        elif usage_percent >= 70:
            risk_level = "medium"

        return {
            "annual_revenue": round(annual_revenue, 2),
            "usn_limit": USN_LIMIT_2026,
            "within_limit": within_limit,
            "usage_percent": round(usage_percent, 2),
            "remaining_capacity": round(remaining, 2),
            "risk_level": risk_level,
            "recommendation": self._get_usn_recommendation(risk_level, within_limit)
        }

    def _get_usn_recommendation(self, risk_level: str, within_limit: bool) -> str:
        """Get recommendation based on USN limit usage"""
        if not within_limit:
            return "Превышен лимит УСН! Необходимо перейти на общую систему налогообложения"
        elif risk_level == "critical":
            return "Близко к лимиту УСН. Подготовьтесь к переходу на ОСНО"
        elif risk_level == "high":
            return "Приближаетесь к лимиту УСН. Рассмотрите оптимизацию или разделение бизнеса"
        elif risk_level == "medium":
            return "Следите за оборотом, чтобы не превысить лимит УСН"
        else:
            return "Оборот в пределах лимита УСН"

    def calculate_forced_promo_impact(
        self,
        original_price: float,
        promo_discount_percent: float,
        expected_volume_increase_percent: float,
        cost_price: float,
        marketplace_commission_percent: float = 15.0
    ) -> Dict[str, Any]:
        """
        Calculate impact of forced marketplace promotion
        Helps seller decide to accept or decline promotion
        """

        # Original profit per unit
        original_calculation = self.calculate_net_profit(
            product_price=original_price,
            cost_price=cost_price,
            marketplace_commission_percent=marketplace_commission_percent
        )

        # Promo price profit per unit
        promo_price = original_price * (1 - promo_discount_percent / 100)
        promo_calculation = self.calculate_net_profit(
            product_price=promo_price,
            cost_price=cost_price,
            marketplace_commission_percent=marketplace_commission_percent
        )

        # Total profit comparison (assuming base volume of 100 units)
        base_volume = 100
        promo_volume = base_volume * (1 + expected_volume_increase_percent / 100)

        original_total_profit = original_calculation["net_profit"] * base_volume
        promo_total_profit = promo_calculation["net_profit"] * promo_volume

        profit_difference = promo_total_profit - original_total_profit

        recommendation = "ПРИНЯТЬ" if profit_difference > 0 else "ОТКЛОНИТЬ"

        return {
            "original_price": original_price,
            "promo_price": round(promo_price, 2),
            "original_profit_per_unit": round(original_calculation["net_profit"], 2),
            "promo_profit_per_unit": round(promo_calculation["net_profit"], 2),
            "expected_volume_increase_percent": expected_volume_increase_percent,
            "total_profit_difference": round(profit_difference, 2),
            "recommendation": recommendation,
            "reason": f"Прибыль {'вырастет' if profit_difference > 0 else 'снизится'} на {abs(profit_difference):.2f} руб."
        }
