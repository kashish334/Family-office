"""
ai/prompts.py – Centralised AI prompt templates.
"""

SYSTEM_PROMPT = """You are a sophisticated AI financial advisor for Family Office, a premium wealth management platform.

Your role:
- Analyse family financial data with precision and care
- Provide actionable, personalised advice grounded in the user's actual data
- Use a warm, professional tone – like a trusted private banker
- Always quantify recommendations when possible (e.g. "saving $200/mo more would reach your goal 3 months earlier")
- Flag risks clearly but constructively
- Respect financial privacy; never expose sensitive data unnecessarily

Your expertise covers:
- Family budget optimisation
- Investment and savings strategy
- Tax-efficient planning
- Expense anomaly detection
- Goal-based financial planning
- Cash flow forecasting

Constraints:
- Never provide specific investment product recommendations without disclaimer
- Do not guarantee returns or outcomes
- If asked about something outside your scope, say so clearly
- Keep responses concise (under 300 words unless detailed analysis is requested)
"""

def build_context_message(
    income: float,
    expenses: float,
    savings_rate: float,
    top_categories: list[dict],
    active_goals: list[dict],
) -> str:
    """Build a structured context block injected before user messages."""
    cats = "\n".join(
        f"  • {c.get('name', c.get('category_id', 'Other'))}: ${c.get('total', 0):,.0f}"
        for c in top_categories[:5]
    )
    goals = "\n".join(
        f"  • {g['name']}: {g['progress_pct']:.0f}% complete (target ${g['target_amount']:,.0f})"
        for g in active_goals[:3]
    )

    return f"""[Live Financial Context]
Monthly Income:    ${income:,.2f}
Monthly Expenses:  ${expenses:,.2f}
Savings Rate:      {savings_rate:.1f}%

Top Spending Categories:
{cats or '  No data'}

Active Savings Goals:
{goals or '  None'}
"""


SPENDING_ANALYSIS_PROMPT = """Analyse the following monthly spending data and identify:
1. The top 3 areas where spending is above average
2. One specific actionable saving opportunity
3. Whether the overall trend is healthy

Be specific with dollar amounts. Keep it under 150 words.

Data:
{data}
"""

MONTHLY_SUMMARY_PROMPT = """Generate a professional monthly financial summary for {month_name} {year}.

Financial Data:
- Total Income: ${income:,.2f}
- Total Expenses: ${expenses:,.2f}
- Net Savings: ${net:,.2f}
- Savings Rate: {savings_rate:.1f}%

Top Spending Categories:
{categories}

Write in second person ("You spent..."). Highlight 2-3 key insights and give 2 actionable recommendations.
Keep under 250 words. Use a professional, encouraging tone.
"""

ANOMALY_DETECTION_PROMPT = """Review these recent transactions and identify any that appear:
- Significantly higher than normal for this category
- Occurring at unusual times
- Potentially duplicated or erroneous

Transactions:
{transactions}

Reply ONLY with a JSON object: {{"anomalies": [{"description": str, "reason": str, "severity": "low|medium|high"}]}}
Only include genuinely suspicious items. If none found, return empty array.
"""
