"""
services/audit_logger/exporter.py — Compliance log exporter

Exports Audit Logs to CSV and formatted PDF compliance reports.
"""
import csv
from io import BytesIO, StringIO
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from services.audit_logger.models import AuditLog

class AuditExporter:
    async def export_pdf(self, tenant_id: str, entries: list[AuditLog], title: str) -> bytes:
        """Builds a formatted PDF compliance report using reportlab."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph(title, styles['Title']))
        elements.append(Paragraph(f"Tenant ID: {tenant_id}", styles['Normal']))
        elements.append(Paragraph(f"Total Entries: {len(entries)}", styles['Normal']))
        elements.append(Spacer(1, 12))

        data = [["Request ID", "Model", "Action Taken", "Score Before", "Score After", "Created At"]]
        for e in entries:
            score_b = e.bias_score_before.get("overall", 0.0) if isinstance(e.bias_score_before, dict) else 0.0
            score_a = e.bias_score_after.get("overall", 0.0) if isinstance(e.bias_score_after, dict) else 0.0
            data.append([
                e.request_id[:8] + "...", 
                e.model, 
                e.action_taken, 
                f"{score_b:.1f}", 
                f"{score_a:.1f}", 
                e.created_at.strftime("%Y-%m-%d %H:%M") if hasattr(e.created_at, 'strftime') else str(e.created_at)
            ])

        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(t)
        doc.build(elements)

        pdf = buffer.getvalue()
        buffer.close()
        return pdf

    async def export_csv(self, entries: list[AuditLog]) -> str:
        """Returns CSV string of all audit entries."""
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "id", "request_id", "model", "action_taken",
            "score_before_overall", "score_after_overall",
            "bias_types", "layers_applied", "created_at"
        ])
        for e in entries:
            score_b = e.bias_score_before.get("overall", 0.0) if isinstance(e.bias_score_before, dict) else 0.0
            score_a = e.bias_score_after.get("overall", 0.0) if isinstance(e.bias_score_after, dict) else 0.0
            writer.writerow([
                str(e.id), e.request_id, e.model, e.action_taken,
                score_b, score_a,
                ";".join(e.bias_types_detected),
                ";".join(e.layers_applied),
                str(e.created_at)
            ])
        return output.getvalue()
