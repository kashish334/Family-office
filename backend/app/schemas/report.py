"""schemas/report.py"""
from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import Any


class ReportRequest(BaseModel):
    report_type: str   # monthly_summary | annual | tax | spending | custom
    format: str = "pdf"  # pdf | xlsx | csv
    parameters: dict[str, Any] | None = None


class ReportResponse(BaseModel):
    id: uuid.UUID
    report_type: str
    title: str
    format: str
    status: str
    public_url: str | None
    created_at: datetime
    completed_at: datetime | None
    model_config = {"from_attributes": True}
