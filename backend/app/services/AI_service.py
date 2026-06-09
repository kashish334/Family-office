"""
services/AI_service.py – OpenAI-powered financial advisor service.
"""
import uuid
from typing import AsyncIterator

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.ai.prompts import SYSTEM_PROMPT, build_context_message
from app.repositories.transaction_repository import TransactionRepository

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.tx_repo = TransactionRepository(db)

    async def chat(
        self,
        family_id: uuid.UUID,
        user_message: str,
        conversation_history: list[dict],
    ) -> str:
        """
        Send a user message to the AI advisor with financial context injected.
        Returns the AI's text response.
        """
        # Build contextual system message with real family data
        context = await self._build_financial_context(family_id)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context},
            *conversation_history[-10:],  # keep last 10 turns to manage tokens
            {"role": "user", "content": user_message},
        ]

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            max_tokens=settings.openai_max_tokens,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""

    async def generate_monthly_summary(
        self,
        family_id: uuid.UUID,
        year: int,
        month: int,
    ) -> str:
        """Generate a natural-language monthly financial summary."""
        from datetime import datetime, timedelta
        date_from = datetime(year, month, 1)
        date_to = datetime(year, month + 1, 1) - timedelta(seconds=1) if month < 12 else datetime(year + 1, 1, 1) - timedelta(seconds=1)

        from app.models.transaction import TransactionType
        income = await self.tx_repo.sum_by_type(family_id, TransactionType.INCOME, date_from, date_to)
        expenses = await self.tx_repo.sum_by_type(family_id, TransactionType.EXPENSE, date_from, date_to)
        cats = await self.tx_repo.sum_by_category(family_id, date_from, date_to)

        top_cats = cats[:5]
        cats_text = "\n".join(f"  - {c['category_id'] or 'Uncategorised'}: ${c['total']:.2f}" for c in top_cats)

        prompt = (
            f"Generate a concise, professional monthly financial summary for {year}-{month:02d}.\n"
            f"Income: ${income:.2f}\nExpenses: ${expenses:.2f}\nNet: ${income - expenses:.2f}\n"
            f"Top spending categories:\n{cats_text}\n"
            "Highlight key insights, flag any concerns, and give 2-3 actionable recommendations. "
            "Write in second person ('You spent...'). Keep it under 250 words."
        )

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=600,
            temperature=0.5,
        )
        return response.choices[0].message.content or ""

    async def detect_anomalies(
        self,
        family_id: uuid.UUID,
        transactions: list,
    ) -> list[dict]:
        """Use AI to flag unusual transactions."""
        if not transactions:
            return []

        tx_text = "\n".join(
            f"- {t.description}: ${t.amount} ({t.transaction_date.date()})"
            for t in transactions[:30]
        )

        prompt = (
            "Review these transactions and identify any that appear unusual, "
            "out-of-pattern, or potentially erroneous. Reply with a JSON array "
            "of objects: [{\"description\": str, \"reason\": str, \"severity\": \"low|medium|high\"}]. "
            "Only include genuinely suspicious items.\n\n"
            f"Transactions:\n{tx_text}"
        )

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a financial fraud and anomaly detection assistant."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        import json
        try:
            result = json.loads(response.choices[0].message.content or "{}")
            return result.get("anomalies", [])
        except json.JSONDecodeError:
            return []

    async def get_savings_recommendations(
        self,
        family_id: uuid.UUID,
        context: str,
    ) -> list[str]:
        """Generate personalised savings recommendations."""
        prompt = (
            f"Based on this family's financial profile:\n{context}\n\n"
            "Provide 5 specific, actionable savings recommendations. "
            "Reply as a JSON array of strings."
        )

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=600,
            temperature=0.6,
            response_format={"type": "json_object"},
        )

        import json
        try:
            result = json.loads(response.choices[0].message.content or "{}")
            return result.get("recommendations", [])
        except json.JSONDecodeError:
            return []

    async def _build_financial_context(self, family_id: uuid.UUID) -> str:
        """Fetch recent data and format it as context for the AI."""
        from datetime import datetime, timedelta
        from app.models.transaction import TransactionType

        now = datetime.utcnow()
        date_from = now - timedelta(days=90)

        income = await self.tx_repo.sum_by_type(family_id, TransactionType.INCOME, date_from, now)
        expenses = await self.tx_repo.sum_by_type(family_id, TransactionType.EXPENSE, date_from, now)
        cats = await self.tx_repo.sum_by_category(family_id, date_from, now)

        cats_text = ", ".join(
            f"{c['category_id'] or 'Other'}: ${c['total']:.0f}"
            for c in cats[:6]
        )

        return (
            f"[Financial Context – last 90 days]\n"
            f"Income: ${income:.2f} | Expenses: ${expenses:.2f} | Net: ${income - expenses:.2f}\n"
            f"Top spending areas: {cats_text}"
        )
