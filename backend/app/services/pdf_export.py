"""
PDF generation service for Syrax Intelligence Reports using ReportLab.
Produces a formatted, branded PDF document without requiring external system C-libraries.
"""
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from app.schemas import IntelligenceReport


def generate_pdf_report(report: IntelligenceReport) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0b192c'),
        spaceAfter=6,
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15,
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0284c7'),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
    )

    score_badge_style = ParagraphStyle(
        'ScoreBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0369a1'),
    )

    story = []

    # Title & Header
    story.append(Paragraph(f"Syrax AI — Intelligence Dossier v{report.version_number}", title_style))
    story.append(Paragraph(
        "AI-Powered Project Idea Validation & Research Intelligence Report | Confidential",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=14))

    # Executive Idea Summary
    story.append(Paragraph("1. Executive Summary & Specification", h2_style))
    domain = report.idea_summary.problem_domain or "Unspecified Domain"
    target = report.idea_summary.target_user or "General Developers"
    approach = report.idea_summary.core_technical_approach or "Not detailed"
    
    summary_text = (
        f"<b>Problem Domain:</b> {domain}<br/>"
        f"<b>Target User:</b> {target}<br/>"
        f"<b>Technical Strategy:</b> {approach}"
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 10))

    # Novelty Assessment
    story.append(Paragraph("2. Grounded Novelty Assessment", h2_style))
    score = report.novelty.novelty_score
    conf = report.novelty.confidence.upper()
    conf_reason = report.novelty.confidence_reason
    story.append(Paragraph(f"<b>Calculated Novelty Score:</b> {score} / 100 ({conf} Confidence)", score_badge_style))
    story.append(Paragraph(f"<i>Assessment Note:</i> {conf_reason}", body_style))
    story.append(Spacer(1, 10))

    # Top Overlapping Prior Art Table
    if report.novelty.top_overlapping_sources:
        story.append(Paragraph("3. Most Overlapping Existing Work", h2_style))
        data = [["Source Title", "Type", "Overlap Score", "Reasoning"]]
        for s in report.novelty.top_overlapping_sources[:5]:
            data.append([
                Paragraph(f"<b>{s.source.title}</b><br/>{s.source.url}", body_style),
                s.source.source_type.upper(),
                f"{s.combined_score:.2f}",
                Paragraph(s.reasoning or "Related problem formulation.", body_style)
            ])
        t = Table(data, colWidths=[160, 50, 60, 260])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('TOPPADDING', (0,0), (-1,0), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))

    # Innovation Gaps
    story.append(Paragraph("4. Evidence-Backed Innovation Gaps", h2_style))
    if report.gaps:
        for i, g in enumerate(report.gaps, 1):
            g_text = (
                f"<b>{i}. {g.description}</b><br/>"
                f"<i>Significance:</i> {g.why_it_matters}<br/>"
                f"<i>Evidence Sources:</i> {', '.join(g.evidence_sources)}"
            )
            story.append(Paragraph(g_text, body_style))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("No significant gaps detected from available sources.", body_style))
    story.append(Spacer(1, 10))

    # Recommendations
    story.append(Paragraph("5. Grounded Differentiation Recommendations", h2_style))
    if report.recommendations:
        for i, r in enumerate(report.recommendations, 1):
            r_text = (
                f"<b>{i}. {r.suggestion}</b><br/>"
                f"<i>Grounding Citations:</i> {', '.join(r.cited_sources)}"
            )
            story.append(Paragraph(r_text, body_style))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("No specific recommendations generated.", body_style))
    story.append(Spacer(1, 10))

    # Suggested Architecture & Roadmap
    story.append(Paragraph("6. Suggested Architecture & Phased Roadmap", h2_style))
    stack_str = ", ".join(report.architecture.stack) if report.architecture.stack else "Standard microservices"
    story.append(Paragraph(f"<b>Recommended Stack:</b> {stack_str}", body_style))
    story.append(Spacer(1, 6))
    if report.architecture.roadmap:
        for step in report.architecture.roadmap:
            story.append(Paragraph(f"• {step}", body_style))
            story.append(Spacer(1, 4))
    story.append(Spacer(1, 10))

    # Footer note
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceBefore=10, spaceAfter=8))
    story.append(Paragraph(
        f"Generated by Syrax AI Intelligence Engine · Total Sources Indexed: {len(report.sources_used)} · Powered by FastAPI & SQLite",
        ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#64748b'))
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
