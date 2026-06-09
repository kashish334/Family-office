"""
analytics/anomaly_detection.py – Statistical anomaly detection using Isolation Forest.
"""
from __future__ import annotations
import uuid
from decimal import Decimal

import numpy as np


def detect_anomalies(
    transactions: list,
    contamination: float = 0.05,  # expected % of anomalies
) -> list[dict]:
    """
    Use scikit-learn IsolationForest to flag unusual transactions.
    Falls back to Z-score method if sklearn not available.

    Returns list of dicts with: transaction_id, description, amount, anomaly_score, reason.
    """
    if len(transactions) < 10:
        return []

    amounts = np.array([float(t.amount) for t in transactions])

    try:
        return _isolation_forest(transactions, amounts, contamination)
    except ImportError:
        return _zscore_method(transactions, amounts)


def _isolation_forest(transactions, amounts, contamination) -> list[dict]:
    from sklearn.ensemble import IsolationForest  # type: ignore

    # Feature matrix: amount, day_of_week, hour_of_day
    features = np.column_stack([
        amounts,
        [t.transaction_date.weekday() for t in transactions],
        [t.transaction_date.hour for t in transactions],
    ])

    model = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100,
    )
    scores = model.fit_predict(features)          # -1 = anomaly, 1 = normal
    raw_scores = model.score_samples(features)    # lower = more anomalous

    results = []
    mean_amt = np.mean(amounts)
    std_amt = np.std(amounts)

    for i, tx in enumerate(transactions):
        if scores[i] == -1:
            amount = float(tx.amount)
            z = (amount - mean_amt) / std_amt if std_amt > 0 else 0

            if amount > mean_amt + 2 * std_amt:
                reason = f"Amount ${amount:,.2f} is significantly above your typical spend (avg ${mean_amt:,.0f})."
            elif tx.transaction_date.weekday() >= 5 and amount > mean_amt * 1.5:
                reason = f"Unusually high weekend transaction (${amount:,.2f})."
            else:
                reason = f"This transaction deviates from your normal spending pattern."

            results.append({
                "transaction_id": str(tx.id),
                "description": tx.description,
                "amount": Decimal(str(amount)),
                "anomaly_score": round(abs(float(raw_scores[i])), 4),
                "reason": reason,
            })

    return sorted(results, key=lambda x: x["anomaly_score"], reverse=True)


def _zscore_method(transactions, amounts) -> list[dict]:
    """Fallback: flag transactions beyond 2.5 standard deviations."""
    mean = np.mean(amounts)
    std = np.std(amounts)
    if std == 0:
        return []

    results = []
    for i, tx in enumerate(transactions):
        z = abs((amounts[i] - mean) / std)
        if z > 2.5:
            results.append({
                "transaction_id": str(tx.id),
                "description": tx.description,
                "amount": Decimal(str(amounts[i])),
                "anomaly_score": round(float(z), 4),
                "reason": f"Amount is {z:.1f} standard deviations above average (${mean:,.0f}).",
            })

    return sorted(results, key=lambda x: x["anomaly_score"], reverse=True)
