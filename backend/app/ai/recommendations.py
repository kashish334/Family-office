"""
ai/chatbot.py – Stateless chat session management.
Conversation history is managed by the client; server is stateless.
"""
from dataclasses import dataclass


@dataclass
class ChatMessage:
    role: str   # "user" | "assistant" | "system"
    content: str


def format_conversation(messages: list[dict]) -> list[dict]:
    """
    Normalise incoming message history for OpenAI format.
    Strips any injected system messages from client to prevent prompt injection.
    """
    cleaned = []
    for msg in messages:
        role = msg.get("role", "user")
        if role not in {"user", "assistant"}:
            continue  # drop any attempts to inject system messages
        content = str(msg.get("content", "")).strip()
        if content:
            cleaned.append({"role": role, "content": content})
    return cleaned[-20:]  # keep last 20 turns max


"""
ai/recommendations.py – Rule-based + AI recommendation engine.
"""
from decimal import Decimal


def generate_quick_recommendations(
    savings_rate: float,
    top_categories: list[dict],
    goals: list[dict],
) -> list[dict]:
    """
    Generate rule-based recommendations without an AI call.
    Used for the dashboard sidebar where latency matters.
    """
    recs = []

    # Savings rate check
    if savings_rate < 10:
        recs.append({
            "type": "savings_alert",
            "severity": "high",
            "title": "Low Savings Rate",
            "body": f"Your current savings rate is {savings_rate:.1f}%. "
                    "Financial experts recommend saving at least 20% of monthly income.",
            "action": "Review your budget to identify areas to cut back.",
        })
    elif savings_rate < 20:
        recs.append({
            "type": "savings_opportunity",
            "severity": "medium",
            "title": "Savings Rate Improvement",
            "body": f"You're saving {savings_rate:.1f}%. Small adjustments could push you to the 20% target.",
            "action": "Try the budget planning tool to find opportunities.",
        })

    # Top category overspend
    for cat in top_categories[:3]:
        pct = cat.get("percentage", 0)
        name = cat.get("category_name", "")
        total = float(cat.get("total", 0))
        if name in ("Food & Dining", "Entertainment", "Shopping") and pct > 25:
            recs.append({
                "type": "overspend_alert",
                "severity": "medium",
                "title": f"High {name} Spend",
                "body": f"{name} accounts for {pct:.0f}% of your expenses this month (${total:,.0f}).",
                "action": f"Set a {name} budget limit to stay on track.",
            })

    # Goals approaching deadline
    for goal in goals:
        progress = goal.get("progress_pct", 0)
        target = goal.get("name", "goal")
        if progress < 30 and goal.get("target_date"):
            recs.append({
                "type": "goal_behind",
                "severity": "medium",
                "title": f"'{target}' Goal at Risk",
                "body": f"You're {progress:.0f}% toward your '{target}' goal.",
                "action": "Consider increasing monthly contributions.",
            })

    return recs[:5]  # max 5 recommendations
