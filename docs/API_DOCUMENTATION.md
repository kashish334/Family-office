# Family Office API Documentation

**Version:** 1.0.0 | **Base URL:** `https://api.family-office.com/api/v1` | **Auth:** Bearer JWT

---

## Overview

The Family Office API is a RESTful service built with FastAPI. All requests and responses use JSON. Authentication uses short-lived JWT access tokens (60 min) paired with long-lived refresh tokens (30 days).

### Base URL
```
Production:  https://api.family-office.com/api/v1
Staging:     https://staging-api.family-office.com/api/v1
Local:       http://localhost:8000/api/v1
```

### Authentication
Include the access token in every protected request:
```http
Authorization: Bearer <access_token>
```

### Response Format
```json
{
  "id": "uuid",
  "created_at": "2024-10-24T12:00:00Z",
  ...data fields
}
```

### Error Format
```json
{
  "detail": "Human-readable error message"
}
```

### Rate Limits
| Endpoint group        | Limit         |
|-----------------------|---------------|
| General API           | 60 req/min    |
| Auth (login/register) | 10 req/min    |
| File uploads          | 20 req/min    |

---

## Authentication

### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "full_name": "Julian Sterling",
  "email": "julian@sterling.com",
  "password": "SecurePass123!"
}
```

**Response `201`:**
```json
{
  "id": "a1b2c3d4-...",
  "full_name": "Julian Sterling",
  "email": "julian@sterling.com",
  "role": "member",
  "avatar_url": null,
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-10-24T10:00:00Z"
}
```

**Errors:** `409` email already exists | `422` validation error

---

### POST /auth/login
Authenticate and receive JWT token pair.

**Request Body:**
```json
{
  "email": "julian@sterling.com",
  "password": "SecurePass123!"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1Qi...",
  "refresh_token": "eyJ0eXAiOiJKV1Qi...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Errors:** `401` invalid credentials | `403` account disabled

---

### POST /auth/refresh
Exchange a refresh token for a new access token.

**Request Body:**
```json
{ "refresh_token": "eyJ0eXAiOiJKV1Qi..." }
```

**Response `200`:** Same as `/auth/login`

---

### GET /auth/me
Returns the current user's profile. Requires auth.

**Response `200`:** Same as register response.

---

## Families

### POST /families
Create a new family. Caller becomes the admin.

**Request Body:**
```json
{
  "name": "The Sterling Family",
  "description": "Our family wealth management account",
  "currency": "USD",
  "timezone": "America/New_York"
}
```

**Response `201`:**
```json
{
  "id": "f1a2b3c4-...",
  "name": "The Sterling Family",
  "currency": "USD",
  "timezone": "America/New_York",
  "plan": "free",
  "created_at": "2024-10-24T10:00:00Z"
}
```

---

### GET /families/{family_id}
Get family details. Requires family membership.

**Response `200`:** Family object (see above)

---

### PATCH /families/{family_id}
Update family details. Requires **admin** role.

**Request Body (all fields optional):**
```json
{
  "name": "Sterling Family Office",
  "currency": "GBP"
}
```

---

### GET /families/{family_id}/members
List all family members.

**Response `200`:**
```json
[
  {
    "id": "m1b2c3-...",
    "user_id": "u1b2c3-...",
    "family_id": "f1b2c3-...",
    "role": "admin",
    "display_name": "Julian",
    "joined_at": "2024-10-01T00:00:00Z"
  }
]
```

---

### POST /families/{family_id}/members
Invite a user by email. Requires **admin** role.

**Request Body:**
```json
{
  "email": "clarissa@sterling.com",
  "role": "member",
  "display_name": "Clarissa"
}
```

Member roles: `admin` | `member` | `dependent` | `advisor`

**Errors:** `404` email not found | `409` already a member

---

### DELETE /families/{family_id}/members/{user_id}
Remove a member. Requires **admin** role. Cannot remove self.

**Response:** `204 No Content`

---

## Transactions

All transaction endpoints are scoped to a family:
`/families/{family_id}/transactions`

### POST /families/{family_id}/transactions

**Request Body:**
```json
{
  "type": "expense",
  "amount": 245.50,
  "currency": "USD",
  "description": "Whole Foods Market",
  "notes": "Weekly grocery shop",
  "category_id": "cat-uuid",
  "transaction_date": "2024-10-24T14:30:00Z",
  "merchant_name": "Whole Foods"
}
```

Transaction types: `income` | `expense` | `transfer`

**Response `201`:**
```json
{
  "id": "tx-uuid",
  "family_id": "fam-uuid",
  "user_id": "user-uuid",
  "category_id": "cat-uuid",
  "type": "expense",
  "status": "completed",
  "amount": "245.50",
  "currency": "USD",
  "description": "Whole Foods Market",
  "transaction_date": "2024-10-24T14:30:00Z",
  "receipt_url": null,
  "is_anomaly": false,
  "is_ocr_generated": false,
  "created_at": "2024-10-24T14:35:00Z"
}
```

---

### GET /families/{family_id}/transactions

**Query Parameters:**
| Parameter    | Type     | Description                          |
|-------------|----------|--------------------------------------|
| `page`       | int      | Page number (default: 1)             |
| `page_size`  | int      | Items per page (default: 20, max: 100)|
| `type`       | string   | Filter: `income` \| `expense`        |
| `category_id`| uuid     | Filter by category                   |
| `user_id`    | uuid     | Filter by family member              |
| `date_from`  | datetime | Start date (ISO 8601)                |
| `date_to`    | datetime | End date (ISO 8601)                  |
| `min_amount` | decimal  | Minimum transaction amount           |
| `max_amount` | decimal  | Maximum transaction amount           |
| `search`     | string   | Full-text search on description      |

**Response `200`:**
```json
{
  "items": [...],
  "total": 248,
  "page": 1,
  "page_size": 20,
  "total_pages": 13
}
```

---

### GET /families/{family_id}/transactions/{transaction_id}
Get a single transaction.

### PATCH /families/{family_id}/transactions/{transaction_id}
Update a transaction (partial update).

### DELETE /families/{family_id}/transactions/{transaction_id}
Soft-delete a transaction. **Response:** `204 No Content`

---

## Analytics

### GET /families/{family_id}/analytics/dashboard

**Query Parameters:** `year` (int), `month` (int, 1-12)

**Response `200`:**
```json
{
  "total_income": "12450.00",
  "total_expenses": "8200.00",
  "net_savings": "4250.00",
  "savings_rate": 34.1,
  "income_change_pct": 12.5,
  "expense_change_pct": 4.2,
  "monthly_trends": [
    {
      "month": "2024-10",
      "income": "12450.00",
      "expenses": "8200.00",
      "net": "4250.00",
      "savings_rate": 34.1
    }
  ],
  "category_breakdown": [
    {
      "category_id": "uuid",
      "category_name": "Housing",
      "total": "3700.00",
      "percentage": 45.1,
      "transaction_count": 3
    }
  ],
  "financial_health_score": 78.5
}
```

---

### GET /families/{family_id}/analytics/health-score

**Response `200`:**
```json
{
  "score": 78.5,
  "grade": "Good",
  "savings_rate_score": 28.0,
  "debt_to_income_score": 22.5,
  "liquidity_score": 18.0,
  "trend_score": 10.0,
  "recommendations": [
    "Consider building a 6-month emergency fund.",
    "Your dining spend is 18% above your 3-month average."
  ]
}
```

Grades: `Excellent` (80+) | `Good` (60-79) | `Fair` (40-59) | `Poor` (<40)

---

### GET /families/{family_id}/analytics/forecast

**Query Parameters:** `periods` (int, 1-12, default: 3)

**Response `200`:**
```json
[
  {
    "month": "2024-11",
    "predicted_expenses": "8450.00",
    "confidence_interval_low": "7200.00",
    "confidence_interval_high": "9700.00",
    "model_used": "linear_regression"
  }
]
```

---

### GET /families/{family_id}/analytics/anomalies

**Response `200`:**
```json
[
  {
    "transaction_id": "tx-uuid",
    "description": "Selfridges & Co.",
    "amount": "4200.00",
    "anomaly_score": 0.847,
    "reason": "Amount is 3.2 standard deviations above your average spend."
  }
]
```

---

## AI Insights

### POST /families/{family_id}/ai/chat

**Request Body:**
```json
{
  "message": "Am I on track for my house fund goal?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Good morning! How can I help?" }
  ]
}
```

**Response `200`:**
```json
{
  "reply": "Based on your current savings rate of 34% and the $450,000 already saved toward your $700,000 House Fund goal, you are on track. At your current pace of ~$4,250/month, you'll reach your target in approximately 14 months..."
}
```

---

### POST /families/{family_id}/ai/monthly-summary

**Request Body:**
```json
{ "year": 2024, "month": 10 }
```

**Response `200`:**
```json
{
  "summary": "October 2024 was a strong month for the Sterling family...",
  "year": 2024,
  "month": 10
}
```

---

### GET /families/{family_id}/ai/recommendations

**Response `200`:**
```json
[
  {
    "type": "overspend_alert",
    "severity": "medium",
    "title": "High Food & Dining Spend",
    "body": "Food & Dining accounts for 28% of your expenses this month ($2,300).",
    "action": "Set a Food & Dining budget limit to stay on track."
  }
]
```

---

### POST /families/{family_id}/ai/savings-advice

**Response `200`:**
```json
{
  "recommendations": [
    "Redirect the $420 monthly surplus to your House Fund escrow account.",
    "Consider switching to annual billing on streaming subscriptions to save ~$180/year.",
    "Your utility spend is 15% above comparable households – consider an energy audit."
  ]
}
```

---

## Savings Goals

### POST /families/{family_id}/savings
Create a savings goal.

**Request Body:**
```json
{
  "name": "House Fund",
  "description": "Pacific Heights Estate Acquisition",
  "icon": "🏠",
  "target_amount": 700000.00,
  "target_date": "2025-12-31",
  "priority": "high"
}
```

Priorities: `low` | `medium` | `high`

---

### GET /families/{family_id}/savings
List all savings goals.

### PATCH /families/{family_id}/savings/{goal_id}
Update a goal.

### POST /families/{family_id}/savings/{goal_id}/contribute

**Request Body:**
```json
{ "amount": 1250.00 }
```

### DELETE /families/{family_id}/savings/{goal_id}
Soft-delete a goal. **Response:** `204 No Content`

---

## Budget Planning

### GET /families/{family_id}/budgets
**Query Parameters:** `year` (int), `month` (int)

### PUT /families/{family_id}/budgets
Upsert (create or update) a budget for a category/month. Requires `can_manage_budgets` permission.

**Request Body:**
```json
{
  "category_id": "cat-uuid",
  "month": 10,
  "year": 2024,
  "limit_amount": 3200.00
}
```

---

## File Uploads & OCR

### POST /families/{family_id}/uploads/receipt
Upload a receipt image for OCR extraction.

**Request:** `multipart/form-data` with `file` field.
Accepted types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
Max size: 10 MB

**Response `201`:**
```json
{
  "file_id": "file-uuid",
  "ocr_extracted": {
    "merchant_name": "Whole Foods Market",
    "total_amount": "245.50",
    "date": "10/24/2024",
    "suggested_category": "Grocery",
    "confidence": 0.87
  }
}
```

---

## Reports

### GET /families/{family_id}/reports/monthly-pdf
Download a monthly report as PDF.

**Query Parameters:** `year` (int), `month` (int)
**Response:** `application/pdf` binary stream with `Content-Disposition: attachment`

---

### GET /families/{family_id}/reports/excel-export
Export transactions as Excel workbook.

**Query Parameters:** `date_from` (datetime), `date_to` (datetime)
**Response:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## Notifications

### GET /notifications
**Query Parameters:** `unread_only` (bool), `limit` (int, max 200)

**Response `200`:**
```json
[
  {
    "id": "notif-uuid",
    "type": "budget_alert",
    "title": "Budget Alert – Food & Dining",
    "body": "You've used 92% of your Food & Dining budget.",
    "action_url": "/budget",
    "is_read": false,
    "created_at": "2024-10-24T09:00:00Z"
  }
]
```

Notification types: `budget_alert` | `bill_reminder` | `goal_milestone` | `ai_insight` | `anomaly_detected` | `system`

### POST /notifications/mark-read
```json
{ "notification_ids": ["uuid1", "uuid2"] }
```

### POST /notifications/mark-all-read
Marks all unread notifications as read.

---

## HTTP Status Codes

| Code | Meaning                                       |
|------|-----------------------------------------------|
| 200  | OK – request succeeded                        |
| 201  | Created – resource created successfully       |
| 204  | No Content – deletion or action succeeded     |
| 400  | Bad Request – invalid input                   |
| 401  | Unauthorized – missing or invalid token       |
| 403  | Forbidden – insufficient permissions          |
| 404  | Not Found – resource does not exist           |
| 409  | Conflict – duplicate or constraint violation  |
| 413  | Payload Too Large – file exceeds size limit   |
| 415  | Unsupported Media Type – invalid file type    |
| 422  | Unprocessable Entity – schema validation fail |
| 429  | Too Many Requests – rate limit exceeded       |
| 500  | Internal Server Error – unexpected failure    |
