"""
Тесты для AuditEngine.

Покрываются:
- Расчёт legal_score: сертификат действует/приостановлен/аннулирован/отсутствует
- Расчёт delivery_score: все диапазоны времени доставки
- Расчёт seo_score: рейтинг, длина описания, ключевые слова
- Расчёт price_score: дамп на других платформах
- Итоговый calculate_total_score: правильность взвешенной суммы
- detect_shadow_ban: падение позиций, изменение цены
- Риски: тип, severity, обязательные поля
"""
import pytest
from app.services.audit_engine import AuditEngine
from app.schemas.audit import RiskItem, AuditScores


# ---------------------------------------------------------------------------
# Вспомогательные функции
# ---------------------------------------------------------------------------

def has_risk_type(risks: list, risk_type: str) -> bool:
    return any(r.type == risk_type for r in risks)


def get_risk(risks: list, risk_type: str):
    return next((r for r in risks if r.type == risk_type), None)


# ---------------------------------------------------------------------------
# Тесты _calculate_legal_score
# ---------------------------------------------------------------------------

class TestCalculateLegalScore:

    def setup_method(self):
        self.engine = AuditEngine()

    def test_valid_certificate_full_marks(self):
        score = self.engine._calculate_legal_score(
            certificate_status={"status": "действует"},
            marking_status=None,  # Не применимо → полные баллы
        )
        assert score == 40.0  # 20 (сертификат) + 20 (маркировка не нужна)

    def test_suspended_certificate_partial_score(self):
        score = self.engine._calculate_legal_score(
            certificate_status={"status": "приостановлен"},
            marking_status=None,
        )
        assert score == 25.0  # 5 (сертификат) + 20 (маркировка не нужна)

    def test_annulled_certificate_zero_cert_score(self):
        score = self.engine._calculate_legal_score(
            certificate_status={"status": "аннулирован"},
            marking_status=None,
        )
        assert score == 20.0  # 0 (сертификат) + 20 (маркировка не нужна)

    def test_missing_certificate_zero_cert_score(self):
        score = self.engine._calculate_legal_score(
            certificate_status=None,
            marking_status=None,
        )
        # Нет сертификата → 0 баллов за сертификат, маркировка N/A → +20
        assert score == 20.0

    def test_missing_certificate_risk_added(self):
        self.engine._calculate_legal_score(
            certificate_status=None,
            marking_status=None,
        )
        assert has_risk_type(self.engine.risks, "certificate_missing")

    def test_valid_marking_full_score(self):
        score = self.engine._calculate_legal_score(
            certificate_status={"status": "действует"},
            marking_status={"is_valid": True},
        )
        assert score == 40.0

    def test_invalid_marking_zero_marking_score(self):
        score = self.engine._calculate_legal_score(
            certificate_status={"status": "действует"},
            marking_status={"is_valid": False},
        )
        assert score == 20.0  # 20 (сертификат) + 0 (маркировка)

    def test_invalid_marking_risk_added(self):
        self.engine._calculate_legal_score(
            certificate_status={"status": "действует"},
            marking_status={"is_valid": False},
        )
        assert has_risk_type(self.engine.risks, "marking_invalid")

    def test_annulled_certificate_risk_severity_critical(self):
        self.engine._calculate_legal_score(
            certificate_status={"status": "аннулирован"},
            marking_status=None,
        )
        risk = get_risk(self.engine.risks, "certificate_annulled")
        assert risk is not None
        assert risk.severity == "critical"

    def test_suspended_certificate_risk_severity_high(self):
        self.engine._calculate_legal_score(
            certificate_status={"status": "приостановлен"},
            marking_status=None,
        )
        risk = get_risk(self.engine.risks, "certificate_suspended")
        assert risk is not None
        assert risk.severity == "high"

    def test_score_never_exceeds_max(self):
        """Итоговый legal_score не может превышать MAX_LEGAL = 40."""
        score = self.engine._calculate_legal_score(
            certificate_status={"status": "действует"},
            marking_status={"is_valid": True},
        )
        assert score <= AuditEngine.MAX_LEGAL


# ---------------------------------------------------------------------------
# Тесты _calculate_delivery_score
# ---------------------------------------------------------------------------

class TestCalculateDeliveryScore:

    def setup_method(self):
        self.engine = AuditEngine()

    def test_unknown_delivery_returns_average(self):
        score = self.engine._calculate_delivery_score(None, None)
        assert score == 15.0
        assert has_risk_type(self.engine.risks, "delivery_time_unknown")

    def test_fast_delivery_full_score(self):
        score = self.engine._calculate_delivery_score(12, None)
        assert score == 30.0

    def test_delivery_18_hours_full_score(self):
        score = self.engine._calculate_delivery_score(18, None)
        assert score == 30.0

    def test_delivery_24_hours_good_score(self):
        score = self.engine._calculate_delivery_score(24, None)
        assert score == 25.0

    def test_delivery_48_hours_medium_score(self):
        score = self.engine._calculate_delivery_score(48, None)
        assert score == 15.0

    def test_delivery_72_hours_low_score(self):
        score = self.engine._calculate_delivery_score(72, None)
        assert score == 5.0
        assert has_risk_type(self.engine.risks, "very_slow_delivery")

    def test_slower_than_competitors_risk(self):
        # Время продавца 60ч, конкурент 30ч → 60 > 30 * 1.5 = 45
        self.engine._calculate_delivery_score(60, 30)
        assert has_risk_type(self.engine.risks, "slower_than_competitors")

    def test_faster_than_competitors_no_risk(self):
        self.engine._calculate_delivery_score(20, 30)
        assert not has_risk_type(self.engine.risks, "slower_than_competitors")

    def test_score_never_exceeds_max(self):
        score = self.engine._calculate_delivery_score(1, None)
        assert score <= AuditEngine.MAX_DELIVERY


# ---------------------------------------------------------------------------
# Тесты _calculate_seo_score
# ---------------------------------------------------------------------------

class TestCalculateSEOScore:

    def setup_method(self):
        self.engine = AuditEngine()

    def test_high_rating_full_rating_score(self):
        score = self.engine._calculate_seo_score(4.9, "X" * 1000, ["kw"] * 10)
        # 10 (рейтинг) + 10 (описание) = 20
        assert score == 20.0

    def test_rating_4_7_threshold(self):
        """Рейтинг ровно 4.7 → максимум за рейтинг."""
        score = self.engine._calculate_seo_score(4.7, "X" * 1000, ["kw"] * 10)
        assert score == 20.0

    def test_medium_rating_partial_score(self):
        score = self.engine._calculate_seo_score(4.3, "X" * 1000, ["kw"] * 10)
        # 7 (рейтинг) + 10 (описание) = 17
        assert score == 17.0

    def test_low_rating_low_score(self):
        score = self.engine._calculate_seo_score(3.5, "X" * 1000, ["kw"] * 10)
        # 3 (рейтинг) + 10 (описание) = 13
        assert score == 13.0

    def test_low_rating_risk_added(self):
        self.engine._calculate_seo_score(3.5, "X" * 1000, [])
        assert has_risk_type(self.engine.risks, "low_rating")

    def test_no_rating_average_score(self):
        score = self.engine._calculate_seo_score(None, "X" * 1000, ["kw"] * 10)
        # 5 (нет рейтинга) + 10 (описание) = 15
        assert score == 15.0

    def test_long_description_full_score(self):
        score = self.engine._calculate_seo_score(4.8, "X" * 1000, [])
        assert score == 20.0  # 10 (рейтинг) + 10 (длинное описание)

    def test_medium_description_partial_score(self):
        score = self.engine._calculate_seo_score(4.8, "X" * 500, [])
        # 10 + 7 = 17
        assert score == 17.0

    def test_short_description_low_score(self):
        score = self.engine._calculate_seo_score(4.8, "X" * 100, [])
        # 10 + 3 = 13
        assert score == 13.0

    def test_short_description_risk_added(self):
        self.engine._calculate_seo_score(4.8, "X" * 100, [])
        assert has_risk_type(self.engine.risks, "incomplete_description")

    def test_few_keywords_risk_added(self):
        self.engine._calculate_seo_score(4.8, "X" * 1000, ["only_one"])
        assert has_risk_type(self.engine.risks, "insufficient_keywords")

    def test_five_keywords_no_risk(self):
        self.engine._calculate_seo_score(4.8, "X" * 1000, ["kw"] * 5)
        assert not has_risk_type(self.engine.risks, "insufficient_keywords")

    def test_score_never_exceeds_max(self):
        score = self.engine._calculate_seo_score(5.0, "X" * 2000, ["kw"] * 20)
        assert score <= AuditEngine.MAX_SEO


# ---------------------------------------------------------------------------
# Тесты _calculate_price_score
# ---------------------------------------------------------------------------

class TestCalculatePriceScore:

    def setup_method(self):
        self.engine = AuditEngine()

    def test_no_price_returns_half(self):
        score = self.engine._calculate_price_score(None, {})
        assert score == 5.0

    def test_no_competitors_full_score(self):
        score = self.engine._calculate_price_score(1000.0, {})
        assert score == 10.0

    def test_price_similar_to_competitors_no_penalty(self):
        # Конкурент дороже → нет штрафа
        score = self.engine._calculate_price_score(1000.0, {"ozon": 1050.0})
        assert score == 10.0

    def test_price_5_percent_cheaper_no_penalty(self):
        """Ровно 5% дешевле — граничное условие: 950 < 1000*0.95=950 → False → штрафа нет."""
        engine = AuditEngine()
        score = engine._calculate_price_score(1000.0, {"ozon": 950.0})
        assert score == 10.0

    def test_price_more_than_5_percent_cheaper_penalty(self):
        # Конкурент дешевле более чем на 5%
        score = self.engine._calculate_price_score(1000.0, {"ozon": 940.0})
        assert score < 10.0
        assert has_risk_type(self.engine.risks, "price_dumping")

    def test_multiple_dumping_platforms(self):
        # 2 платформы с демпингом → 2 риска
        score = self.engine._calculate_price_score(
            1000.0, {"ozon": 900.0, "yandex": 850.0}
        )
        dumping_risks = [r for r in self.engine.risks if r.type == "price_dumping"]
        assert len(dumping_risks) == 2

    def test_score_never_negative(self):
        # Много платформ с демпингом → score не уходит в минус
        score = self.engine._calculate_price_score(
            1000.0, {f"platform{i}": 800.0 for i in range(10)}
        )
        assert score >= 0.0



# ---------------------------------------------------------------------------
# Тесты calculate_total_score
# ---------------------------------------------------------------------------

class TestCalculateTotalScore:

    def setup_method(self):
        self.engine = AuditEngine()

    def test_total_score_correct_weighted_sum(self):
        """Итоговый балл = legal + delivery + seo + price (уже взвешенные)."""
        scores, risks, recs = self.engine.calculate_total_score(
            product_data={
                "delivery_time_hours": 12,   # → 30
                "rating": 4.9,               # → 10
                "description": "X" * 1000,  # → 10
                "seo_keywords": ["kw"] * 10,
                "current_price": 1000.0,
                "competitor_prices": {},
            },
            certificate_status={"status": "действует"},  # → 20
            marking_status={"is_valid": True},            # → 20
        )
        # legal=40, delivery=30, seo=20, price=10 → total=100
        assert scores.total_score == 100.0

    def test_total_score_range_0_to_100(self):
        """Итоговый балл всегда в диапазоне [0, 100]."""
        scores, _, _ = self.engine.calculate_total_score(
            product_data={
                "delivery_time_hours": 999,  # Плохая доставка
                "rating": 1.0,               # Плохой рейтинг
                "description": "X" * 10,    # Короткое описание
                "seo_keywords": [],
                "current_price": 1000.0,
                "competitor_prices": {"ozon": 500.0},  # Демпинг
            },
            certificate_status={"status": "аннулирован"},
            marking_status={"is_valid": False},
        )
        assert 0.0 <= scores.total_score <= 100.0

    def test_returns_audit_scores_object(self):
        scores, risks, recs = self.engine.calculate_total_score(
            product_data={"delivery_time_hours": 24},
        )
        assert isinstance(scores, AuditScores)
        assert isinstance(risks, list)
        assert isinstance(recs, list)

    def test_risks_have_required_fields(self):
        _, risks, _ = self.engine.calculate_total_score(
            product_data={},
            certificate_status={"status": "аннулирован"},
            marking_status={"is_valid": False},
        )
        for risk in risks:
            assert isinstance(risk, RiskItem)
            assert risk.type
            assert risk.severity in ("low", "medium", "high", "critical")
            assert risk.description
            assert risk.recommendation

    def test_engine_resets_state_between_calls(self):
        """Повторный вызов не накапливает риски от предыдущего вызова."""
        self.engine.calculate_total_score(
            product_data={},
            certificate_status={"status": "аннулирован"},
        )
        first_risks_count = len(self.engine.risks)

        self.engine.calculate_total_score(
            product_data={},
            certificate_status={"status": "действует"},
        )
        # После второго вызова риски должны соответствовать только второму вызову
        for risk in self.engine.risks:
            assert risk.type != "certificate_annulled"


# ---------------------------------------------------------------------------
# Тесты detect_shadow_ban
# ---------------------------------------------------------------------------

class TestDetectShadowBan:

    def setup_method(self):
        self.engine = AuditEngine()

    def test_no_history_returns_false(self):
        result = self.engine.detect_shadow_ban([], [])
        assert result is False

    def test_one_entry_returns_false(self):
        result = self.engine.detect_shadow_ban(
            [{"position": 10, "date": "2026-01-01"}], []
        )
        assert result is False

    def test_small_position_drop_no_ban(self):
        result = self.engine.detect_shadow_ban(
            [{"position": 10}, {"position": 30}],  # Падение на 20 позиций
            [],
        )
        assert result is False

    def test_large_drop_without_price_change_is_ban(self):
        result = self.engine.detect_shadow_ban(
            [{"position": 5}, {"position": 60}],  # Падение на 55 позиций
            [{"price": 1000.0}, {"price": 1000.0}],  # Цена не менялась
        )
        assert result is True
        assert has_risk_type(self.engine.risks, "shadow_ban_detected")

    def test_large_drop_with_price_change_no_ban(self):
        """Падение позиций при изменении цены — не теневой бан."""
        result = self.engine.detect_shadow_ban(
            [{"position": 5}, {"position": 60}],
            [{"price": 1000.0}, {"price": 500.0}],  # Цена изменилась
        )
        assert result is False

    def test_shadow_ban_risk_severity_critical(self):
        self.engine.detect_shadow_ban(
            [{"position": 1}, {"position": 100}],
            [{"price": 1000.0}, {"price": 1000.0}],
        )
        risk = get_risk(self.engine.risks, "shadow_ban_detected")
        assert risk is not None
        assert risk.severity == "critical"
