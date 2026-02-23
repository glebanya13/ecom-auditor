"""
Тесты для LegalDocGenerator.

Покрываются:
- generate_complaint_289fz: все типы нарушений, форматирование, валидация пустых полей
- generate_fas_complaint: обязательные поля, правовая база
- generate_offer_change_notification: форматирование даты, срок уведомления
- generate_fns_vat_explanation: расчёт НДС, валидация ИНН
- generate_return_dispute: поля заказа, стоимость товара
- get_template_list: полнота шаблонов
"""
import pytest
from app.services.legal_doc_generator import LegalDocGenerator, VIOLATION_ARTICLES


# ---------------------------------------------------------------------------
# Фикстура
# ---------------------------------------------------------------------------

@pytest.fixture
def generator():
    return LegalDocGenerator()


# ---------------------------------------------------------------------------
# Тесты generate_complaint_289fz
# ---------------------------------------------------------------------------

class TestGenerateComplaint289fz:

    def test_contains_seller_name(self, generator):
        result = generator.generate_complaint_289fz(
            seller_name="ООО Тест",
            seller_inn="7700000001",
            marketplace_name="Wildberries",
            marketplace_legal_name="ООО «Вайлдберриз»",
            article_number="SKU12345",
            violation_type="unauthorized_penalty",
            violation_date="2026-01-15",
            violation_description="Незаконное снятие 5000 руб. за несуществующее нарушение",
        )
        assert "ООО Тест" in result

    def test_contains_article_number(self, generator):
        result = generator.generate_complaint_289fz(
            seller_name="ИП Иванов",
            seller_inn="",
            marketplace_name="Ozon",
            marketplace_legal_name="ООО «Интернет Решения»",
            article_number="OZON-999",
            violation_type="ranking_manipulation",
            violation_date="2026-02-01",
            violation_description="Падение с 10 на 500 позицию без объяснений",
        )
        assert "OZON-999" in result

    def test_contains_correct_legal_article(self, generator):
        """Каждый тип нарушения должен маппиться на правильную статью."""
        for violation_type, info in VIOLATION_ARTICLES.items():
            result = generator.generate_complaint_289fz(
                seller_name="Продавец",
                seller_inn="",
                marketplace_name="WB",
                marketplace_legal_name="ООО «Вайлдберриз»",
                article_number="ART001",
                violation_type=violation_type,
                violation_date="2026-01-10",
                violation_description="Описание нарушения для теста, достаточно длинное",
            )
            assert info["article"] in result, (
                f"Для violation_type='{violation_type}' не найдена статья '{info['article']}'"
            )

    def test_penalty_included_when_positive(self, generator):
        result = generator.generate_complaint_289fz(
            seller_name="ИП Петров",
            seller_inn="",
            marketplace_name="WB",
            marketplace_legal_name="ООО «Вайлдберриз»",
            article_number="ART002",
            violation_type="unauthorized_penalty",
            violation_date="2026-01-20",
            violation_description="Удержали штраф без предупреждения",
            penalty_amount=7500.0,
        )
        assert "7,500.00" in result or "7500" in result

    def test_penalty_absent_when_zero(self, generator):
        result = generator.generate_complaint_289fz(
            seller_name="ИП Петров",
            seller_inn="",
            marketplace_name="WB",
            marketplace_legal_name="ООО «Вайлдберриз»",
            article_number="ART003",
            violation_type="ranking_manipulation",
            violation_date="2026-01-20",
            violation_description="Пессимизация позиций",
            penalty_amount=0.0,
        )
        # Строки с возвратом денег не должно быть
        assert "Возвратить необоснованно удержанную сумму" not in result

    def test_empty_seller_name_raises(self, generator):
        with pytest.raises(ValueError, match="seller_name"):
            generator.generate_complaint_289fz(
                seller_name="",
                seller_inn="",
                marketplace_name="WB",
                marketplace_legal_name="ООО «Вайлдберриз»",
                article_number="ART004",
                violation_type="unauthorized_penalty",
                violation_date="2026-01-20",
                violation_description="Описание",
            )

    def test_empty_description_raises(self, generator):
        with pytest.raises(ValueError, match="violation_description"):
            generator.generate_complaint_289fz(
                seller_name="ООО Тест",
                seller_inn="",
                marketplace_name="WB",
                marketplace_legal_name="ООО «Вайлдберриз»",
                article_number="ART005",
                violation_type="unauthorized_penalty",
                violation_date="2026-01-20",
                violation_description="",
            )

    def test_unknown_violation_type_uses_default(self, generator):
        """Неизвестный тип нарушения не должен поднимать исключение."""
        result = generator.generate_complaint_289fz(
            seller_name="ООО Тест",
            seller_inn="",
            marketplace_name="WB",
            marketplace_legal_name="ООО «Вайлдберриз»",
            article_number="ART006",
            violation_type="some_unknown_type",
            violation_date="2026-01-20",
            violation_description="Тестовое нарушение",
        )
        assert "ФЗ № 289-ФЗ" in result

    def test_inn_included_in_output(self, generator):
        result = generator.generate_complaint_289fz(
            seller_name="ООО Тест",
            seller_inn="7700000001",
            marketplace_name="WB",
            marketplace_legal_name="ООО «Вайлдберриз»",
            article_number="ART007",
            violation_type="unfair_blocking",
            violation_date="2026-01-10",
            violation_description="Заблокировали карточку без оснований",
        )
        assert "7700000001" in result

    def test_result_is_non_empty_string(self, generator):
        result = generator.generate_complaint_289fz(
            seller_name="Тест",
            seller_inn="",
            marketplace_name="WB",
            marketplace_legal_name="ООО «Вайлдберриз»",
            article_number="ART008",
            violation_type="forced_promotion",
            violation_date="2026-01-05",
            violation_description="Принудили участвовать в акции",
        )
        assert isinstance(result, str) and len(result) > 200


# ---------------------------------------------------------------------------
# Тесты generate_fas_complaint
# ---------------------------------------------------------------------------

class TestGenerateFASComplaint:

    def test_contains_fas_in_header(self, generator):
        result = generator.generate_fas_complaint(
            seller_name="ООО Пример",
            marketplace_name="Ozon",
            violation_description="Антимонопольное поведение со стороны маркетплейса с детальным описанием ситуации",
            evidence_description="Скриншоты, данные аналитики",
        )
        assert "ФАС" in result

    def test_contains_marketplace_name(self, generator):
        result = generator.generate_fas_complaint(
            seller_name="ИП Сидоров",
            marketplace_name="Яндекс Маркет",
            violation_description="Систематическое снижение позиций без оснований для конкретных продавцов",
            evidence_description="Данные из личного кабинета",
        )
        assert "Яндекс Маркет" in result

    def test_empty_marketplace_raises(self, generator):
        with pytest.raises(ValueError, match="marketplace_name"):
            generator.generate_fas_complaint(
                seller_name="ООО Тест",
                marketplace_name="",
                violation_description="Нарушение",
                evidence_description="Доказательства",
            )

    def test_contains_law_references(self, generator):
        result = generator.generate_fas_complaint(
            seller_name="ООО Тест",
            marketplace_name="WB",
            violation_description="Подробное описание антимонопольного нарушения с деталями",
            evidence_description="Скриншоты и данные",
        )
        assert "135-ФЗ" in result
        assert "289-ФЗ" in result


# ---------------------------------------------------------------------------
# Тесты generate_offer_change_notification
# ---------------------------------------------------------------------------

class TestGenerateOfferChangeNotification:

    def test_contains_45_days_requirement(self, generator):
        result = generator.generate_offer_change_notification(
            change_description="Изменение условий логистики и комиссии",
            change_date="2026-03-01",
            notification_requirement_days=45,
        )
        assert "45" in result

    def test_contains_change_description(self, generator):
        desc = "Повышение комиссии с 15% до 20%"
        result = generator.generate_offer_change_notification(
            change_description=desc,
            change_date="2026-03-01",
        )
        assert desc in result

    def test_custom_notification_days(self, generator):
        result = generator.generate_offer_change_notification(
            change_description="Изменение условий хранения",
            change_date="2026-04-01",
            notification_requirement_days=60,
        )
        assert "60" in result

    def test_empty_description_raises(self, generator):
        with pytest.raises(ValueError, match="change_description"):
            generator.generate_offer_change_notification(
                change_description="",
                change_date="2026-03-01",
            )


# ---------------------------------------------------------------------------
# Тесты generate_fns_vat_explanation
# ---------------------------------------------------------------------------

class TestGenerateFNSVATExplanation:

    def test_contains_seller_info(self, generator):
        result = generator.generate_fns_vat_explanation(
            seller_name="ООО НДС Плательщик",
            seller_inn="7700000001",
            tax_period="1 квартал 2026 г.",
            marketplace_name="Wildberries",
            gross_revenue=1_000_000.0,
            marketplace_fee=150_000.0,
        )
        assert "ООО НДС Плательщик" in result
        assert "7700000001" in result

    def test_vat_calculation(self, generator):
        """НДС должен быть корректно вычислен (расчётная ставка 22/122)."""
        gross = 1_220_000.0
        result = generator.generate_fns_vat_explanation(
            seller_name="ИП НДС",
            seller_inn="771234567890",  # 12 цифр (ИП)
            tax_period="2 квартал 2026 г.",
            marketplace_name="Ozon",
            gross_revenue=gross,
            marketplace_fee=180_000.0,
            vat_rate=0.22,
        )
        # НДС = 1 220 000 * 0.22 / 1.22 ≈ 220 000
        assert "220,000.00" in result or "220000" in result

    def test_explicit_vat_amount_used(self, generator):
        """Если vat_amount передан явно — должен использоваться без пересчёта."""
        result = generator.generate_fns_vat_explanation(
            seller_name="ООО Точный НДС",
            seller_inn="7700000001",
            tax_period="3 квартал 2026 г.",
            marketplace_name="Ozon",
            gross_revenue=500_000.0,
            marketplace_fee=75_000.0,
            vat_amount=99_999.0,
        )
        assert "99,999.00" in result or "99999" in result

    def test_invalid_inn_raises_value_error(self, generator):
        with pytest.raises(ValueError, match="ИНН"):
            generator.generate_fns_vat_explanation(
                seller_name="ООО Тест",
                seller_inn="123",  # Некорректный
                tax_period="1 квартал 2026 г.",
                marketplace_name="WB",
                gross_revenue=100_000.0,
                marketplace_fee=10_000.0,
            )

    def test_22_percent_rate_mentioned(self, generator):
        result = generator.generate_fns_vat_explanation(
            seller_name="ООО НДС",
            seller_inn="7700000001",
            tax_period="1 квартал 2026 г.",
            marketplace_name="WB",
            gross_revenue=200_000.0,
            marketplace_fee=30_000.0,
        )
        assert "22" in result


# ---------------------------------------------------------------------------
# Тесты generate_return_dispute
# ---------------------------------------------------------------------------

class TestGenerateReturnDispute:

    def test_contains_order_number(self, generator):
        result = generator.generate_return_dispute(
            seller_name="ИП Иванов",
            marketplace_name="Ozon",
            order_number="ORDER-XYZ-12345",
            return_date="2026-01-15",
            product_name="Кроссовки Nike Air",
            return_reason_stated="Не подошёл размер",
            dispute_grounds="Товар был продан в правильном размере согласно заказу покупателя",
        )
        assert "ORDER-XYZ-12345" in result

    def test_cost_included_when_provided(self, generator):
        result = generator.generate_return_dispute(
            seller_name="ООО Продавец",
            marketplace_name="WB",
            order_number="WB-RET-001",
            return_date="2026-02-01",
            product_name="Пальто зимнее",
            return_reason_stated="Брак",
            dispute_grounds="Товар прошёл ОТК, брак отсутствует, фото прилагаются",
            product_cost=8500.0,
        )
        assert "8,500.00" in result or "8500" in result

    def test_cost_absent_when_zero(self, generator):
        result = generator.generate_return_dispute(
            seller_name="ООО Продавец",
            marketplace_name="WB",
            order_number="WB-RET-002",
            return_date="2026-02-01",
            product_name="Носки",
            return_reason_stated="Не понравился цвет",
            dispute_grounds="Цвет соответствует описанию товара",
        )
        assert "Возместить стоимость" not in result

    def test_empty_dispute_grounds_raises(self, generator):
        with pytest.raises(ValueError, match="dispute_grounds"):
            generator.generate_return_dispute(
                seller_name="ООО Тест",
                marketplace_name="WB",
                order_number="WB-001",
                return_date="2026-01-01",
                product_name="Товар",
                return_reason_stated="Причина",
                dispute_grounds="",
            )

    def test_contains_legal_basis(self, generator):
        result = generator.generate_return_dispute(
            seller_name="ООО Тест",
            marketplace_name="Ozon",
            order_number="OZ-001",
            return_date="2026-01-10",
            product_name="Телефон",
            return_reason_stated="Плохое качество",
            dispute_grounds="Товар соответствует стандартам, экспертиза не проводилась",
        )
        assert "469" in result or "475" in result  # Статьи ГК РФ


# ---------------------------------------------------------------------------
# Тесты get_template_list
# ---------------------------------------------------------------------------

class TestGetTemplateList:

    def test_all_five_templates_present(self, generator):
        templates = generator.get_template_list()
        expected_keys = {
            "complaint_289fz",
            "fas_complaint",
            "offer_change_notification",
            "fns_vat_explanation",
            "return_dispute",
        }
        assert set(templates.keys()) == expected_keys

    def test_each_template_has_required_fields(self, generator):
        templates = generator.get_template_list()
        for key, value in templates.items():
            assert "name" in value, f"Шаблон '{key}' не содержит 'name'"
            assert "description" in value, f"Шаблон '{key}' не содержит 'description'"
            assert "legal_basis" in value, f"Шаблон '{key}' не содержит 'legal_basis'"

    def test_violation_types_match_articles(self, generator):
        """Типы нарушений в шаблоне complaint_289fz должны совпадать с VIOLATION_ARTICLES."""
        templates = generator.get_template_list()
        complaint_template = templates["complaint_289fz"]
        for v_type in complaint_template["supported_violations"]:
            assert v_type in VIOLATION_ARTICLES, (
                f"Тип нарушения '{v_type}' в шаблоне не найден в VIOLATION_ARTICLES"
            )
