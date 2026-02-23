"""
Main audit engine with scoring algorithm
Implements the scoring formula from requirements
"""
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from ..schemas.audit import RiskItem, AuditScores


class AuditEngine:
    """
    Core audit engine implementing the scoring algorithm:
    - Legal_Score (40%): Certificate (20) + Marking (20)
    - Delivery_Score (30%): Speed relative to competitors
    - SEO_Score (20%): Completeness and rating (>4.7)
    - Price_Score (10%): No dumping on other platforms
    """

    # Scoring weights
    LEGAL_WEIGHT = 0.40
    DELIVERY_WEIGHT = 0.30
    SEO_WEIGHT = 0.20
    PRICE_WEIGHT = 0.10

    # Maximum scores per category
    MAX_LEGAL = 40.0
    MAX_DELIVERY = 30.0
    MAX_SEO = 20.0
    MAX_PRICE = 10.0

    def __init__(self):
        self.risks: List[RiskItem] = []
        self.recommendations: List[str] = []

    def calculate_total_score(
        self,
        product_data: Dict[str, Any],
        certificate_status: Optional[Dict[str, Any]] = None,
        marking_status: Optional[Dict[str, Any]] = None,
        competitor_delivery_time: Optional[int] = None
    ) -> Tuple[AuditScores, List[RiskItem], List[str]]:
        """
        Calculate complete audit score
        Returns: (scores, risks, recommendations)
        """
        self.risks = []
        self.recommendations = []

        # Calculate each component
        legal_score = self._calculate_legal_score(certificate_status, marking_status)
        delivery_score = self._calculate_delivery_score(
            product_data.get("delivery_time_hours"),
            competitor_delivery_time
        )
        seo_score = self._calculate_seo_score(
            product_data.get("rating"),
            product_data.get("description", ""),
            product_data.get("seo_keywords", [])
        )
        price_score = self._calculate_price_score(
            product_data.get("current_price"),
            product_data.get("competitor_prices", {})
        )

        # Calculate total (weighted sum)
        total_score = legal_score + delivery_score + seo_score + price_score

        scores = AuditScores(
            total_score=round(total_score, 2),
            legal_score=round(legal_score, 2),
            delivery_score=round(delivery_score, 2),
            seo_score=round(seo_score, 2),
            price_score=round(price_score, 2)
        )

        return scores, self.risks, self.recommendations

    def _calculate_legal_score(
        self,
        certificate_status: Optional[Dict[str, Any]],
        marking_status: Optional[Dict[str, Any]]
    ) -> float:
        """
        Calculate Legal Score (max 40 points)
        - Certificate: 20 points
        - Marking: 20 points
        """
        score = 0.0

        # Certificate check (20 points)
        if certificate_status:
            if certificate_status.get("status", "").lower() in ["действует", "valid", "active"]:
                score += 20.0
                self.recommendations.append("✓ Сертификат действителен")
            elif "приостановлен" in certificate_status.get("status", "").lower():
                score += 5.0
                self.risks.append(RiskItem(
                    type="certificate_suspended",
                    severity="high",
                    description="Сертификат приостановлен в базе Росаккредитации",
                    recommendation="Срочно свяжитесь с органом сертификации для восстановления"
                ))
            elif "аннулирован" in certificate_status.get("status", "").lower():
                score += 0.0
                self.risks.append(RiskItem(
                    type="certificate_annulled",
                    severity="critical",
                    description="Сертификат аннулирован! Продажа товара незаконна",
                    recommendation="Немедленно снимите товар с продажи и оформите новый сертификат"
                ))
        else:
            self.risks.append(RiskItem(
                type="certificate_missing",
                severity="critical",
                description="Сертификат не найден в системе",
                recommendation="Проверьте номер сертификата и загрузите актуальный документ"
            ))

        # Marking check (20 points)
        if marking_status:
            if marking_status.get("is_valid"):
                score += 20.0
                self.recommendations.append("✓ Маркировка корректна")
            else:
                score += 0.0
                self.risks.append(RiskItem(
                    type="marking_invalid",
                    severity="high",
                    description="Коды маркировки не соответствуют остаткам",
                    recommendation="Сверьте остатки с данными Честного ЗНАКа, возможны штрафы ФНС"
                ))
        elif marking_status is None:
            # If marking is not applicable, give full points
            score += 20.0

        return min(score, self.MAX_LEGAL)

    def _calculate_delivery_score(
        self,
        delivery_time_hours: Optional[int],
        competitor_avg_hours: Optional[int]
    ) -> float:
        """
        Calculate Delivery Score (max 30 points)
        Based on delivery speed relative to competitors
        """
        if not delivery_time_hours:
            self.risks.append(RiskItem(
                type="delivery_time_unknown",
                severity="medium",
                description="Время доставки не определено",
                recommendation="Проверьте размещение товара на складах"
            ))
            return 15.0  # Average score if unknown

        # Target: under 18 hours for premium score
        if delivery_time_hours <= 18:
            score = 30.0
            self.recommendations.append(f"✓ Отличное время доставки: {delivery_time_hours}ч")
        elif delivery_time_hours <= 24:
            score = 25.0
            self.recommendations.append(f"Время доставки {delivery_time_hours}ч - можно улучшить")
        elif delivery_time_hours <= 48:
            score = 15.0
            self.risks.append(RiskItem(
                type="slow_delivery",
                severity="medium",
                description=f"Время доставки {delivery_time_hours}ч выше среднего",
                recommendation="Рассмотрите размещение на складах ближе к крупным городам"
            ))
        else:
            score = 5.0
            self.risks.append(RiskItem(
                type="very_slow_delivery",
                severity="high",
                description=f"Критически долгая доставка: {delivery_time_hours}ч",
                recommendation="Срочно оптимизируйте логистику (Екатеринбург, Новосибирск, Казань)"
            ))

        # Compare with competitors if data available
        if competitor_avg_hours and delivery_time_hours > competitor_avg_hours * 1.5:
            self.risks.append(RiskItem(
                type="slower_than_competitors",
                severity="high",
                description=f"Доставка в 1.5 раза медленнее конкурентов ({competitor_avg_hours}ч)",
                recommendation="Это снижает ваши позиции в поиске"
            ))

        return min(score, self.MAX_DELIVERY)

    def _calculate_seo_score(
        self,
        rating: Optional[float],
        description: str,
        keywords: List[str]
    ) -> float:
        """
        Calculate SEO Score (max 20 points)
        - Rating > 4.7: 10 points
        - Description completeness: 10 points
        """
        score = 0.0

        # Rating check (10 points)
        if rating:
            if rating >= 4.7:
                score += 10.0
                self.recommendations.append(f"✓ Отличный рейтинг: {rating}")
            elif rating >= 4.0:
                score += 7.0
                self.recommendations.append(f"Рейтинг {rating} - работайте над качеством")
            else:
                score += 3.0
                self.risks.append(RiskItem(
                    type="low_rating",
                    severity="high",
                    description=f"Низкий рейтинг {rating}",
                    recommendation="Улучшите качество товара и обработку возвратов"
                ))
        else:
            score += 5.0

        # Description completeness (10 points)
        if len(description) >= 1000:
            score += 10.0
            self.recommendations.append("✓ Подробное описание товара")
        elif len(description) >= 500:
            score += 7.0
            self.recommendations.append("Описание можно дополнить")
        else:
            score += 3.0
            self.risks.append(RiskItem(
                type="incomplete_description",
                severity="medium",
                description="Недостаточно подробное описание",
                recommendation="Добавьте характеристики, преимущества, способы применения"
            ))

        # Keywords check
        if len(keywords) < 5:
            self.risks.append(RiskItem(
                type="insufficient_keywords",
                severity="low",
                description="Мало ключевых слов для SEO",
                recommendation="Используйте популярные поисковые фразы в описании"
            ))

        return min(score, self.MAX_SEO)

    def _calculate_price_score(
        self,
        current_price: Optional[float],
        competitor_prices: Dict[str, float]
    ) -> float:
        """
        Calculate Price Score (max 10 points)
        Checks for price dumping on other platforms
        """
        if not current_price:
            return 5.0

        score = 10.0

        # Check cross-platform price differences
        for platform, price in competitor_prices.items():
            if price < current_price * 0.95:  # More than 5% cheaper elsewhere
                score -= 3.0
                self.risks.append(RiskItem(
                    type="price_dumping",
                    severity="medium",
                    description=f"Цена на {platform} ниже на {int((1 - price/current_price)*100)}%",
                    recommendation="Риск пессимизации за разницу в цене более 5%"
                ))

        return max(0.0, min(score, self.MAX_PRICE))

    def detect_shadow_ban(
        self,
        position_history: List[Dict[str, Any]],
        price_history: List[Dict[str, Any]]
    ) -> bool:
        """
        Detect potential shadow ban
        Signs: >50 positions drop without price/stock changes
        """
        if len(position_history) < 2:
            return False

        latest = position_history[-1]
        previous = position_history[-2]

        position_drop = latest.get("position", 0) - previous.get("position", 0)

        # Check if price was stable
        price_changed = False
        if len(price_history) >= 2:
            price_diff = abs(price_history[-1].get("price", 0) - price_history[-2].get("price", 0))
            price_changed = price_diff > 0.01

        if position_drop > 50 and not price_changed:
            self.risks.append(RiskItem(
                type="shadow_ban_detected",
                severity="critical",
                description=f"Резкое падение позиций на {position_drop} пунктов без изменения цены",
                recommendation="Возможен теневой бан. Проверьте соответствие правилам площадки"
            ))
            return True

        return False
