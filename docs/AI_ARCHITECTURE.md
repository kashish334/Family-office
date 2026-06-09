# AI Architecture

**Model:** OpenAI GPT-4o-mini | **Analytics:** scikit-learn + pandas + NumPy

---

## Overview

Family Office integrates AI across five distinct layers, each with a different latency and cost profile:

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Feature Layers                        │
├──────────────────────┬────────────────┬─────────────────────┤
│  Layer               │  Latency       │  Technology         │
├──────────────────────┼────────────────┼─────────────────────┤
│  1. Financial Chatbot│  1–3s          │  OpenAI GPT-4o-mini │
│  2. Monthly Summaries│  2–5s (async)  │  OpenAI GPT-4o-mini │
│  3. Anomaly Detection│  50–200ms      │  Isolation Forest   │
│  4. Spending Analysis│  10–50ms       │  Pandas / NumPy     │
│  5. Quick Recs       │  <5ms          │  Rule engine        │
└──────────────────────┴────────────────┴─────────────────────┘
```

---

## 1. Financial Chatbot (`app/services/AI_service.py`)

### Architecture

```
User Message
    │
    ▼
format_conversation()          ← strips injection attempts, trims to 20 turns
    │
    ▼
_build_financial_context()     ← fetches live DB data (income/expenses/categories)
    │
    ▼
OpenAI Chat Completions API    ← GPT-4o-mini with system prompt + context
    │
    ▼
Response text                  ← returned to client
```

### System Prompt Design

The system prompt (`app/ai/prompts.py`) instructs the model to:
1. Act as a private banker — warm, precise, and data-driven
2. Always quantify advice ("saving $200/mo more reaches your goal 3 months sooner")
3. Stay within scope (financial planning, not general Q&A)
4. Never guarantee returns or give legal advice

### Context Injection

Before every chat completion, real family data is injected as a "Financial Context" block:

```
[Live Financial Context]
Monthly Income:    $12,450.00
Monthly Expenses:  $8,200.00
Savings Rate:      34.1%

Top Spending Categories:
  • Housing: $3,700
  • Food & Dining: $1,840
  • Transport: $940

Active Savings Goals:
  • House Fund: 65% complete (target $700,000)
```

This gives the model factual grounding without requiring it to retrieve data itself.

### Conversation Memory

The API is stateless — conversation history is managed by the client. The server accepts `history: []` in the request body and includes the last 20 turns to stay within the token budget.

**Token budget management:**
- System prompt + context: ~400 tokens
- History (20 turns): ~1,000–2,000 tokens
- User message: ~200 tokens
- Response: ~500–1,000 tokens
- Total: well within GPT-4o-mini's 128k context window

### Prompt Injection Prevention

`app/ai/chatbot.py::format_conversation()` filters out any messages with `role = "system"` from the client-supplied history, preventing users from overriding the system prompt.

---

## 2. Monthly Financial Summaries

Triggered by the Celery beat scheduler on the 1st of every month for each family, or on-demand via `POST /families/{id}/ai/monthly-summary`.

### Generation Pipeline

```python
# 1. Fetch data
income   = await repo.sum_by_type(family_id, INCOME, date_from, date_to)
expenses = await repo.sum_by_type(family_id, EXPENSE, date_from, date_to)
categories = await repo.sum_by_category(family_id, date_from, date_to)

# 2. Build structured prompt
prompt = MONTHLY_SUMMARY_PROMPT.format(
    month_name="October", year=2024,
    income=income, expenses=expenses,
    net=income-expenses,
    savings_rate=34.1,
    categories=cat_text,
)

# 3. Generate (temperature=0.5 for consistent style)
response = await client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[system, user_prompt],
    max_tokens=600,
    temperature=0.5,
)

# 4. Store as AIInsight record
```

**Output example:**
> October 2024 was a strong month for the Sterling family. Your income of $12,450 exceeded expenses by $4,250, maintaining a healthy 34% savings rate. Housing (45%) and Food & Dining (22%) drove the bulk of spend. One concern: Entertainment climbed 18% vs. your September average. Recommendations: consider setting a $400 monthly Entertainment limit, and redirect the $420 surplus directly to your House Fund escrow.

---

## 3. Anomaly Detection (`app/analytics/anomaly_detection.py`)

### Primary Method: Isolation Forest

Uses scikit-learn's `IsolationForest` on a feature matrix:

```python
features = np.column_stack([
    transaction_amounts,           # primary signal
    day_of_week_per_transaction,   # weekend patterns
    hour_of_day_per_transaction,   # late-night transactions
])

model = IsolationForest(contamination=0.05, n_estimators=100, random_state=42)
scores = model.fit_predict(features)  # -1 = anomaly
```

**Why Isolation Forest:**
- Unsupervised — no labelled training data required
- Linear time complexity O(n log n)
- Robust to high-dimensional spaces
- Works well on small datasets (50–500 transactions)

### Fallback: Z-Score Method

When scikit-learn is unavailable or data is too sparse (<10 samples):
```python
z_score = abs((amount - mean) / std)
is_anomaly = z_score > 2.5  # ~99th percentile
```

### Anomaly Reason Generation

Human-readable reasons are generated using simple heuristics:
```python
if amount > mean + 2 * std:
    reason = f"Amount ${amount:,.2f} is significantly above your typical spend (avg ${mean:,.0f})."
elif tx.transaction_date.weekday() >= 5 and amount > mean * 1.5:
    reason = "Unusually high weekend transaction."
else:
    reason = "This transaction deviates from your normal spending pattern."
```

### AI-Augmented Anomaly Explanation

For anomalies that need richer context, `AI_service.detect_anomalies()` passes flagged transactions to GPT-4o-mini for natural-language explanation. This is an optional enhancement over the statistical method.

---

## 4. Expense Forecasting (`app/analytics/forecasting.py`)

### Model: Linear Regression with Confidence Intervals

```python
from sklearn.linear_model import LinearRegression

# X = month index [0, 1, 2, ..., n]
# y = monthly expense total
model = LinearRegression()
model.fit(X, amounts)

# Prediction with 95% CI
predicted = model.predict([[future_month_index]])
ci_width = 1.96 * residuals.std()
```

**Assumptions:**
- Monthly spending follows a linear trend over the training period
- Residuals are approximately normally distributed
- Training period: last 12 months of data

**Limitations:**
- Does not capture seasonality (e.g., higher holiday spend in December)
- Not suitable for families with very volatile or sparse transaction history
- Confidence intervals widen significantly beyond 3-month projections

**Future enhancement:** Replace with ARIMA or Prophet for seasonal decomposition.

---

## 5. Rule-Based Quick Recommendations (`app/ai/recommendations.py`)

The fastest recommendation layer — no API call, pure Python logic. Used in the dashboard sidebar where sub-100ms latency is required.

```python
rules = [
    # Savings rate rules
    (savings_rate < 10)  → "Your savings rate is only X%. Aim for 20%."
    (savings_rate < 20)  → "Small adjustments could push you to the 20% target."

    # Category overspend rules
    (category_pct > 25 AND category in ["Food & Dining", "Entertainment", "Shopping"])
                         → "Category X accounts for Y% of expenses this month."

    # Goal behind-schedule rules
    (goal_progress < 30 AND goal has target_date)
                         → "Your 'X' goal is at risk — consider increasing contributions."
]
```

---

## Financial Health Score (`app/analytics/financial_health.py`)

A composite 0–100 score across four dimensions:

| Dimension            | Weight | Calculation                                     |
|----------------------|--------|-------------------------------------------------|
| Savings Rate         | 35 pts | Scaled linearly; 30%+ = full score              |
| Debt-to-Income       | 25 pts | Inversely scaled; 0% DTI = full score           |
| Liquidity            | 20 pts | Months of emergency fund / 6 = score fraction  |
| Spending Trend       | 20 pts | Improving over last 3 months = full score       |

**Grade mapping:**
- 80–100: Excellent
- 60–79: Good
- 40–59: Fair
- 0–39: Poor

---

## AI Safety & Quality Controls

### Hallucination Prevention
- All financial figures are injected as raw data — the model is instructed to use them verbatim, not estimate
- Temperature set to 0.5 for summaries (0.7 for chat) to balance accuracy vs. creativity
- Responses are always attributed to "current data" rather than general advice

### Cost Controls
- `max_tokens=600` for summaries, 1000 for chat responses
- Only the last 20 conversation turns sent to API
- Monthly summaries are cached as `AIInsight` DB records — not regenerated on every request
- Quick recommendations use the rule engine first; AI only called for deep analysis

### Error Handling
- All OpenAI API calls wrapped in try/except
- Graceful degradation: if AI service is unavailable, rule-based recommendations are returned
- JSON response parsing uses `try/except` with empty-list fallback

### Input Sanitisation
- User chat input is capped at 2000 characters before sending to API
- Conversation history limited to 20 turns
- Client-injected system messages are stripped

---

## Token Cost Estimation

At GPT-4o-mini pricing ($0.15 per 1M input tokens, $0.60 per 1M output tokens):

| Feature              | Avg Tokens/Call | Cost/Call   | Monthly (100 users)  |
|----------------------|-----------------|-------------|----------------------|
| Chat message         | ~1,800 in/out   | ~$0.00063   | ~$1.89               |
| Monthly summary      | ~800 in/out     | ~$0.00036   | ~$0.43 (once/family) |
| Anomaly explanation  | ~1,200 in/out   | ~$0.00054   | ~$0.54 (weekly)      |
| Savings advice       | ~900 in/out     | ~$0.00040   | ~$0.48               |

**Estimated total for 100 active families: < $5/month.**
