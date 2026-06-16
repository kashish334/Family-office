"""
services/AI_service.py – Gemini-powered financial advisor service.

CHANGED (this update):
  - All Gemini calls now wrapped in try/except to catch transient errors
    (503 UNAVAILABLE / high demand, rate limits, etc.) and return a friendly
    in-app message instead of raising — this prevents the 500 error that was
    surfacing in the browser as a CORS failure (FastAPI's CORS middleware
    doesn't attach headers to unhandled-exception responses).
  - Added one automatic retry with a short backoff for 503s before falling
    back to the friendly message.
  - gemini_model now configurable; works with gemini-2.5-flash etc.

(Previously changed: switched from OpenAI to Gemini via OpenAI-compatible
endpoint; ₹ currency; real category names via JOIN fix.)

Required .env:
    GEMINI_API_KEY="your-google-ai-studio-key"
    GEMINI_MODEL="gemini-2.5-flash"
"""
import asyncio
import uuid
from typing import AsyncIterator

from openai import AsyncOpenAI, APIStatusError, APIConnectionError, RateLimitError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.ai.prompts import SYSTEM_PROMPT, build_context_message
from app.repositories.transaction_repository import TransactionRepository

settings = get_settings()

client = AsyncOpenAI(
    api_key=settings.gemini_api_key,
    base_url=settings.gemini_base_url,
)

# ── CHANGED: friendly fallback message shown when Gemini is unavailable ──────
FALLBACK_MESSAGE = (
    "I'm having trouble reaching the AI service right now — it looks like the "
    "model is experiencing high demand. Please try again in a moment."
)


async def _call_gemini_with_retry(**kwargs):
    """
    Call client.chat.completions.create with one retry on transient errors
    (503 UNAVAILABLE, rate limits, connection errors). Returns the response
    object, or None if all attempts fail.
    """
    for attempt in range(2):  # 1 retry = 2 total attempts
        try:
            return await client.chat.completions.create(**kwargs)
        except (APIStatusError, RateLimitError, APIConnectionError) as e:
            is_last = attempt == 1
            if is_last:
                return None
            # Brief backoff before retrying (helps with transient 503s)
            await asyncio.sleep(1.5)
    return None
# ─────────────────────────────────────────────────────────────────────────────


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
        Returns the AI's text response, or a friendly fallback on failure.
        """
        context = await self._build_financial_context(family_id)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context},
            *conversation_history[-10:],
            {"role": "user", "content": user_message},
        ]

        # ── CHANGED: wrapped with retry + fallback ──────────────────────────
        response = await _call_gemini_with_retry(
            model=settings.gemini_model,
            messages=messages,
            max_tokens=settings.gemini_max_tokens,
            temperature=0.7,
        )
        if response is None:
            return FALLBACK_MESSAGE
        return response.choices[0].message.content or FALLBACK_MESSAGE
        # ─────────────────────────────────────────────────────────────────────

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
        cats_text = "\n".join(
            f"  - {c.get('name') or 'Uncategorised'}: ₹{c['total']:.2f}" for c in top_cats
        )

        prompt = (
            f"Generate a concise, professional monthly financial summary for {year}-{month:02d}.\n"
            f"Income: ₹{income:.2f}\nExpenses: ₹{expenses:.2f}\nNet: ₹{income - expenses:.2f}\n"
            f"Top spending categories:\n{cats_text}\n"
            "Highlight key insights, flag any concerns, and give 2-3 actionable recommendations. "
            "Write in second person ('You spent...'). Use ₹ for all amounts. "
            "Do not use markdown formatting (no **, *, #). Keep it under 250 words."
        )

        # ── CHANGED: wrapped with retry + fallback ──────────────────────────
        response = await _call_gemini_with_retry(
            model=settings.gemini_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=600,
            temperature=0.5,
        )
        if response is None:
            return FALLBACK_MESSAGE
        return response.choices[0].message.content or FALLBACK_MESSAGE
        # ─────────────────────────────────────────────────────────────────────

    async def detect_anomalies(
        self,
        family_id: uuid.UUID,
        transactions: list,
    ) -> list[dict]:
        """Use AI to flag unusual transactions."""
        if not transactions:
            return []

        tx_text = "\n".join(
            f"- {t.description}: ₹{t.amount} ({t.transaction_date.date()})"
            for t in transactions[:30]
        )

        prompt = (
            "Review these transactions and identify any that appear unusual, "
            "out-of-pattern, or potentially erroneous. All amounts are in Indian "
            "Rupees (₹). Reply with a JSON object with key \"anomalies\" containing "
            "an array of objects: [{\"description\": str, \"reason\": str, \"severity\": \"low|medium|high\"}]. "
            "Only include genuinely suspicious items.\n\n"
            f"Transactions:\n{tx_text}"
        )

        # ── CHANGED: wrapped with retry + fallback ──────────────────────────
        response = await _call_gemini_with_retry(
            model=settings.gemini_model,
            messages=[
                {"role": "system", "content": "You are a financial fraud and anomaly detection assistant. Always respond with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        if response is None:
            return []
        # ─────────────────────────────────────────────────────────────────────

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
            "Provide 5 specific, actionable savings recommendations using ₹ amounts. "
            "Reply as a JSON object with key \"recommendations\" containing an array of strings. "
            "Do not use markdown formatting in the strings."
        )

        # ── CHANGED: wrapped with retry + fallback ──────────────────────────
        response = await _call_gemini_with_retry(
            model=settings.gemini_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT + " Always respond with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=600,
            temperature=0.6,
            response_format={"type": "json_object"},
        )
        if response is None:
            return []
        # ─────────────────────────────────────────────────────────────────────

        import json
        try:
            result = json.loads(response.choices[0].message.content or "{}")
            return result.get("recommendations", [])
        except json.JSONDecodeError:
            return []

    async def _build_financial_context(self, family_id: uuid.UUID) -> str:
        """
        Build a rich context block for the AI:
          - Today's actual date (so the AI knows what "this month" / "last month" /
            "July 2026" mean relative to now, instead of treating any future-sounding
            month as out of scope)
          - A month-by-month income/expense breakdown for the CURRENT YEAR, so the
            AI can answer questions about any specific month already in the data
            (e.g. "analyse July 2026") without needing a 90-day rolling window.
          - Last-90-days summary + top categories (kept for general "how am I doing"
            questions)
        """
        from datetime import datetime, timedelta
        from app.models.transaction import TransactionType

        now = datetime.utcnow()

        # ── CHANGED: tell the AI what "today" is ────────────────────────────
        today_str = now.strftime("%B %d, %Y")  # e.g. "June 12, 2026"
        # ─────────────────────────────────────────────────────────────────────

        # ── CHANGED: full current-year month-by-month breakdown ─────────────
        monthly_rows = await self.tx_repo.monthly_totals(family_id, year=now.year)

        # Pivot into {month_key: {income, expenses}}
        from decimal import Decimal
        pivot: dict[str, dict] = {}
        for row in monthly_rows:
            key = (
                row["month"].strftime("%Y-%m")
                if hasattr(row["month"], "strftime")
                else str(row["month"])[:7]
            )
            if key not in pivot:
                pivot[key] = {"income": Decimal("0"), "expenses": Decimal("0")}
            if row["type"] == TransactionType.INCOME:
                pivot[key]["income"] += Decimal(str(row["total"]))
            else:
                pivot[key]["expenses"] += Decimal(str(row["total"]))

        # Only include months that actually have data (avoid a wall of zeroes)
        month_lines = []
        for month_key in sorted(pivot.keys()):
            vals = pivot[month_key]
            if vals["income"] == 0 and vals["expenses"] == 0:
                continue
            month_name = datetime.strptime(month_key, "%Y-%m").strftime("%B %Y")
            net = vals["income"] - vals["expenses"]
            month_lines.append(
                f"  - {month_name}: Income ₹{vals['income']:.2f}, "
                f"Expenses ₹{vals['expenses']:.2f}, Net ₹{net:.2f}"
            )
        monthly_breakdown_text = "\n".join(month_lines) if month_lines else "  No transaction data yet."
        # ─────────────────────────────────────────────────────────────────────

        # Last 90 days summary + top categories (existing behaviour, kept)
        date_from = now - timedelta(days=90)
        income = await self.tx_repo.sum_by_type(family_id, TransactionType.INCOME, date_from, now)
        expenses = await self.tx_repo.sum_by_type(family_id, TransactionType.EXPENSE, date_from, now)
        cats = await self.tx_repo.sum_by_category(family_id, date_from, now)

        cats_text = ", ".join(
            f"{c.get('name') or 'Other'}: ₹{c['total']:.0f}"
            for c in cats[:6]
        )

        return (
            f"[Current Date]\nToday is {today_str}.\n\n"
            f"[Monthly Breakdown – {now.year}]\n"
            f"{monthly_breakdown_text}\n\n"
            f"[Last 90 Days Summary]\n"
            f"Income: ₹{income:.2f} | Expenses: ₹{expenses:.2f} | Net: ₹{income - expenses:.2f}\n"
            f"Top spending areas (last 90 days): {cats_text}\n\n"
            "When the user asks about a specific month (e.g. \"July 2026\"), use the "
            "[Monthly Breakdown] figures for that month if listed above. If a month "
            "is not listed, it means no transactions have been recorded for it yet — "
            "say so plainly rather than assuming it is a future/inaccessible date."
        )