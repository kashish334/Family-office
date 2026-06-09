"""
api/routes/reports.py
"""
import uuid
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.services.report_service import ReportService

router = APIRouter(prefix="/families/{family_id}/reports", tags=["Reports"])


@router.get("/monthly-pdf")
async def download_monthly_pdf(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    year: int = Query(default=datetime.utcnow().year),
    month: int = Query(default=datetime.utcnow().month, ge=1, le=12),
):
    """Generate and stream a monthly PDF report."""
    membership = await get_family_membership(family_id, current_user, db)
    from app.core.permissions import assert_can_view_reports
    assert_can_view_reports(membership)

    service = ReportService(db)
    pdf_bytes = await service.generate_monthly_pdf(family_id, year, month)
    filename = f"family-office-{year}-{month:02d}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/excel-export")
async def download_excel(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    date_from: datetime = Query(default=None),
    date_to: datetime = Query(default=None),
):
    """Export transactions as Excel workbook."""
    await get_family_membership(family_id, current_user, db)
    from datetime import timedelta
    now = datetime.utcnow()
    df = date_from or (now - timedelta(days=90))
    dt = date_to or now

    service = ReportService(db)
    xlsx_bytes = await service.generate_excel_export(family_id, df, dt)

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="transactions.xlsx"'},
    )


"""
api/routes/uploads.py – File upload and OCR endpoints.
"""
import os
import uuid as uuid_lib
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.config import get_settings
from app.models.uploaded_file import UploadedFile
from app.services.OCR_service import OCRService

settings = get_settings()
uploads_router = APIRouter(prefix="/families/{family_id}/uploads", tags=["File Uploads"])


@uploads_router.post("/receipt", status_code=201)
async def upload_receipt(
    family_id: uuid_lib.UUID,
    file: UploadFile,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Upload a receipt image and run OCR extraction.
    Returns extracted transaction data ready for user confirmation.
    """
    await get_family_membership(family_id, current_user, db)

    # Validate file type
    if file.content_type not in settings.allowed_mimetypes:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type not allowed. Accepted: {', '.join(settings.allowed_mimetypes)}",
        )

    # Validate file size
    content = await file.read()
    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.max_upload_size_mb}MB.",
        )

    # Save to disk (use S3 in production)
    upload_dir = Path(settings.upload_dir) / str(family_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid_lib.uuid4().hex}_{Path(file.filename or 'upload').name}"
    file_path = upload_dir / safe_name

    with open(file_path, "wb") as f:
        f.write(content)

    # Run OCR
    ocr_service = OCRService()
    ocr_data = await ocr_service.extract_from_image(str(file_path))
    suggested_category = ocr_service.suggest_category(
        ocr_data.get("merchant_name"), ocr_data.get("raw_text", "")
    )

    # Save metadata
    uploaded = UploadedFile(
        family_id=family_id,
        uploaded_by=current_user.id,
        filename=safe_name,
        original_filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        storage_path=str(file_path),
        purpose="receipt",
        ocr_data=ocr_data,
    )
    db.add(uploaded)
    await db.flush()
    await db.refresh(uploaded)

    return {
        "file_id": str(uploaded.id),
        "ocr_extracted": {
            "merchant_name": ocr_data.get("merchant_name"),
            "total_amount": str(ocr_data.get("total_amount", "")),
            "date": ocr_data.get("date"),
            "suggested_category": suggested_category,
            "confidence": ocr_data.get("confidence", 0),
        },
    }


# Make typing work for router
from typing import Annotated
