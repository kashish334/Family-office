"""
api/routes/ai.py - AI advisor chat and insight generation endpoints.
"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies import CurrentUser, get_family_membership
from app.services.AI_service import AIService
from app.ai.recommendations import generate_quick_recommendations

router = APIRouter(prefix="/families/{family_id}/ai", tags=["AI Insights"])


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    reply: str


class SummaryRequest(BaseModel):
    year: int
    month: int


def format_conversation(history: list[dict]) -> list[dict]:
    formatted = []
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            formatted.append({"role": role, "content": content})
    return formatted


@router.post("/chat", response_model=ChatResponse)
async def chat(
    family_id: uuid.UUID,
    body: ChatRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    await get_family_membership(family_id, current_user, db)
    history = format_conversation(body.history)
    service = AIService(db)
    reply = await service.chat(family_id, body.message, history)
    return ChatResponse(reply=reply)


@router.post("/monthly-summary")
async def generate_monthly_summary(
    family_id: uuid.UUID,
    body: SummaryRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await get_family_membership(family_id, current_user, db)
    service = AIService(db)
    summary = await service.generate_monthly_summary(family_id, body.year, body.month)
    return {"summary": summary, "year": body.year, "month": body.month}


@router.get("/recommendations")
async def get_recommendations(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    await get_family_membership(family_id, current_user, db)
    from datetime import datetime
    from app.repositories.transaction_repository import TransactionRepository
    from app.models.transaction import TransactionType
    from app.analytics.spending_analysis import compute_category_breakdown

    repo = TransactionRepository(db)
    now = datetime.utcnow()
    date_from = datetime(now.year, now.month, 1)

    income = await repo.sum_by_type(family_id, TransactionType.INCOME, date_from, now)
    expenses = await repo.sum_by_type(family_id, TransactionType.EXPENSE, date_from, now)
    cats_raw = await repo.sum_by_category(family_id, date_from, now)
    cats = compute_category_breakdown(cats_raw, expenses)

    savings_rate = float((income - expenses) / income * 100) if income > 0 else 0.0
    return generate_quick_recommendations(
        savings_rate=savings_rate,
        top_categories=[c.model_dump() for c in cats],
        goals=[],
    )


@router.post("/savings-advice")
async def get_savings_advice(
    family_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await get_family_membership(family_id, current_user, db)
    service = AIService(db)
    context = await service._build_financial_context(family_id)
    recs = await service.get_savings_recommendations(family_id, context)
    return {"recommendations": recs}
