"""
PDF Report Generator
Generates comprehensive audit reports in PDF format
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
from typing import Dict, Any, List
import os


class PDFReportGenerator:
    """Generate PDF audit reports"""

    def __init__(self, output_dir: str = "reports"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        # Setup styles
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=1  # Center
        ))

        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=12,
            spaceBefore=12
        ))

        self.styles.add(ParagraphStyle(
            name='RiskHigh',
            parent=self.styles['Normal'],
            textColor=colors.red,
            fontSize=10
        ))

        self.styles.add(ParagraphStyle(
            name='RiskMedium',
            parent=self.styles['Normal'],
            textColor=colors.orange,
            fontSize=10
        ))

    def generate_full_audit_report(
        self,
        product_data: Dict[str, Any],
        audit_results: Dict[str, Any],
        user_data: Dict[str, Any]
    ) -> str:
        """
        Generate complete audit report PDF
        Returns: path to generated PDF file
        """

        # Create filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sku = product_data.get("sku_id", "unknown")
        filename = f"audit_report_{sku}_{timestamp}.pdf"
        filepath = os.path.join(self.output_dir, filename)

        # Create PDF
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []

        # Title
        title = Paragraph(
            "КОМПЛЕКСНЫЙ АУДИТ ТОВАРА<br/>E-COM AUDITOR 2026",
            self.styles['CustomTitle']
        )
        story.append(title)
        story.append(Spacer(1, 0.5*cm))

        # Report metadata
        report_date = datetime.now().strftime("%d.%m.%Y %H:%M")
        metadata = [
            ["Дата отчета:", report_date],
            ["Клиент:", user_data.get("full_name", "")],
            ["Артикул:", product_data.get("sku_id", "")],
            ["Маркетплейс:", product_data.get("marketplace", "").upper()],
        ]

        metadata_table = Table(metadata, colWidths=[4*cm, 12*cm])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(metadata_table)
        story.append(Spacer(1, 1*cm))

        # Overall Score
        scores = audit_results.get("scores", {})
        total_score = scores.get("total_score", 0)

        score_color = self._get_score_color(total_score)
        score_text = f'<font size="36" color="{score_color}"><b>{total_score}</b></font>/100'
        score_para = Paragraph(score_text, self.styles['Normal'])
        story.append(score_para)
        story.append(Spacer(1, 0.5*cm))

        # Score interpretation
        interpretation = self._get_score_interpretation(total_score)
        story.append(Paragraph(f"<b>Оценка:</b> {interpretation}", self.styles['Normal']))
        story.append(Spacer(1, 1*cm))

        # Detailed scores breakdown
        story.append(Paragraph("ДЕТАЛИЗАЦИЯ ОЦЕНКИ", self.styles['SectionHeader']))

        score_breakdown = [
            ["Категория", "Баллы", "Максимум", "%"],
            ["Юридический комплаенс", f"{scores.get('legal_score', 0)}", "40", f"{scores.get('legal_score', 0)/40*100:.0f}%"],
            ["Логистика и доставка", f"{scores.get('delivery_score', 0)}", "30", f"{scores.get('delivery_score', 0)/30*100:.0f}%"],
            ["SEO и контент", f"{scores.get('seo_score', 0)}", "20", f"{scores.get('seo_score', 0)/20*100:.0f}%"],
            ["Ценообразование", f"{scores.get('price_score', 0)}", "10", f"{scores.get('price_score', 0)/10*100:.0f}%"],
        ]

        score_table = Table(score_breakdown, colWidths=[8*cm, 2*cm, 2*cm, 2*cm])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(score_table)
        story.append(Spacer(1, 1*cm))

        # Risks detected
        risks = audit_results.get("risks_detected", [])
        if risks:
            story.append(Paragraph("ОБНАРУЖЕННЫЕ РИСКИ", self.styles['SectionHeader']))

            for i, risk in enumerate(risks, 1):
                severity = risk.get("severity", "medium")
                risk_style = self._get_risk_style(severity)

                risk_text = f"<b>{i}. [{severity.upper()}] {risk.get('type', '')}:</b><br/>"
                risk_text += f"{risk.get('description', '')}<br/>"
                risk_text += f"<i>Рекомендация: {risk.get('recommendation', '')}</i>"

                story.append(Paragraph(risk_text, risk_style))
                story.append(Spacer(1, 0.3*cm))

            story.append(Spacer(1, 0.5*cm))

        # Recommendations
        recommendations = audit_results.get("recommendations", [])
        if recommendations:
            story.append(Paragraph("РЕКОМЕНДАЦИИ", self.styles['SectionHeader']))

            for rec in recommendations:
                story.append(Paragraph(f"• {rec}", self.styles['Normal']))

            story.append(Spacer(1, 1*cm))

        # Financial analysis
        if "margin_percentage" in audit_results:
            story.append(PageBreak())
            story.append(Paragraph("ФИНАНСОВЫЙ АНАЛИЗ", self.styles['SectionHeader']))

            financial_data = [
                ["Показатель", "Значение"],
                ["Маржинальность", f"{audit_results.get('margin_percentage', 0):.2f}%"],
                ["Расчетная прибыль", f"{audit_results.get('estimated_profit', 0):.2f} ₽"],
                ["НДС 22%", f"{audit_results.get('vat_amount', 0):.2f} ₽"],
            ]

            financial_table = Table(financial_data, colWidths=[10*cm, 6*cm])
            financial_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(financial_table)

        # Footer
        story.append(Spacer(1, 2*cm))
        footer_text = f"<i>Отчет сгенерирован системой E-Com Auditor 2026<br/>{report_date}</i>"
        story.append(Paragraph(footer_text, self.styles['Normal']))

        # Build PDF
        doc.build(story)

        return filepath

    def _get_score_color(self, score: float) -> str:
        """Get color based on score"""
        if score >= 80:
            return "#27ae60"  # Green
        elif score >= 60:
            return "#f39c12"  # Orange
        else:
            return "#e74c3c"  # Red

    def _get_score_interpretation(self, score: float) -> str:
        """Get text interpretation of score"""
        if score >= 90:
            return "Отлично - товар полностью соответствует требованиям"
        elif score >= 80:
            return "Хорошо - незначительные улучшения"
        elif score >= 60:
            return "Удовлетворительно - требуются улучшения"
        elif score >= 40:
            return "Плохо - существенные проблемы"
        else:
            return "Критично - немедленные действия необходимы"

    def _get_risk_style(self, severity: str):
        """Get paragraph style based on risk severity"""
        if severity in ["high", "critical"]:
            return self.styles['RiskHigh']
        elif severity == "medium":
            return self.styles['RiskMedium']
        else:
            return self.styles['Normal']
