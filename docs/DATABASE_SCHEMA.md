# Database Schema Documentation

**Engine:** PostgreSQL 16 | **ORM:** SQLAlchemy 2.0 (async) | **Migrations:** Alembic

---

## Design Principles

- **UUID primary keys** on all tables — avoids enumeration attacks and simplifies distributed inserts
- **Soft deletes** — every entity has `deleted_at TIMESTAMPTZ NULL`; nothing is ever hard-deleted
- **UTC timestamps** — all `TIMESTAMPTZ` columns store UTC; timezone conversion happens in the application layer
- **Normalised to 3NF** — no data duplication; categories are shared across families via `is_system` flag
- **Composite indexes** on the most common query patterns (family + date, family + type, etc.)
- **JSONB** for flexible metadata fields (OCR data, notification payloads, report parameters)
- **Numeric(14,2)** for all monetary values — no floating-point rounding errors

---

## Entity Relationship Diagram (textual)

```
users
  └─< family_members >─┐
                        └─ families
                              ├─< transactions >─ categories
                              ├─< budgets >─ categories
                              ├─< savings_goals
                              ├─< recurring_transactions >─ categories
                              ├─< ai_insights
                              └─< reports

transactions
  └─< uploaded_files

users
  └─< notifications
```

---

## Table: users

Stores user accounts. One user can belong to multiple families.

| Column            | Type                | Constraints                     | Description                        |
|-------------------|---------------------|---------------------------------|------------------------------------|
| `id`              | UUID                | PK, DEFAULT uuid4()             | Unique identifier                  |
| `email`           | VARCHAR(255)        | UNIQUE, NOT NULL, INDEX         | Login email                        |
| `hashed_password` | VARCHAR(255)        | NOT NULL                        | bcrypt hash (12 rounds)            |
| `full_name`       | VARCHAR(255)        | NOT NULL                        | Display name                       |
| `role`            | ENUM(UserRole)      | NOT NULL, DEFAULT 'member'      | Platform-level role                |
| `avatar_url`      | VARCHAR(500)        | NULL                            | Profile picture URL                |
| `phone`           | VARCHAR(50)         | NULL                            | Optional phone number              |
| `is_active`       | BOOLEAN             | DEFAULT TRUE                    | Account enabled flag               |
| `is_verified`     | BOOLEAN             | DEFAULT FALSE                   | Email verified flag                |
| `created_at`      | TIMESTAMPTZ         | DEFAULT now()                   | Account creation timestamp         |
| `updated_at`      | TIMESTAMPTZ         | DEFAULT now(), ON UPDATE now()  | Last modification timestamp        |
| `last_login_at`   | TIMESTAMPTZ         | NULL                            | Last successful login              |
| `deleted_at`      | TIMESTAMPTZ         | NULL                            | Soft delete timestamp              |

**Indexes:**
- `ix_users_email` UNIQUE on `email`

**Roles:** `super_admin` | `family_admin` | `member` | `dependent` | `advisor`

---

## Table: families

Top-level account grouping unit. All financial data is scoped to a family.

| Column        | Type           | Constraints               | Description                          |
|---------------|----------------|---------------------------|--------------------------------------|
| `id`          | UUID           | PK                        |                                      |
| `name`        | VARCHAR(255)   | NOT NULL                  | Family display name                  |
| `description` | TEXT           | NULL                      | Optional description                 |
| `currency`    | CHAR(3)        | DEFAULT 'USD'             | ISO 4217 base currency               |
| `timezone`    | VARCHAR(100)   | DEFAULT 'UTC'             | IANA timezone identifier             |
| `logo_url`    | VARCHAR(500)   | NULL                      | Family/office logo URL               |
| `plan`        | VARCHAR(50)    | DEFAULT 'free'            | Subscription tier                    |
| `created_at`  | TIMESTAMPTZ    | DEFAULT now()             |                                      |
| `updated_at`  | TIMESTAMPTZ    | DEFAULT now(), ON UPDATE  |                                      |
| `deleted_at`  | TIMESTAMPTZ    | NULL                      | Soft delete                          |

---

## Table: family_members

Join table connecting users to families with per-membership roles and permission flags.

| Column                      | Type            | Constraints                          | Description                    |
|-----------------------------|-----------------|--------------------------------------|--------------------------------|
| `id`                        | UUID            | PK                                   |                                |
| `family_id`                 | UUID            | FK → families.id CASCADE, INDEX      |                                |
| `user_id`                   | UUID            | FK → users.id CASCADE, INDEX         |                                |
| `role`                      | ENUM(MemberRole)| DEFAULT 'member'                     | Family-scoped role             |
| `display_name`              | VARCHAR(100)    | NULL                                 | Nickname within family         |
| `color`                     | CHAR(7)         | NULL                                 | Hex color for avatar           |
| `can_view_all_transactions` | BOOLEAN         | DEFAULT TRUE                         | Permission flag                |
| `can_add_transactions`      | BOOLEAN         | DEFAULT TRUE                         | Permission flag                |
| `can_manage_budgets`        | BOOLEAN         | DEFAULT FALSE                        | Permission flag                |
| `can_invite_members`        | BOOLEAN         | DEFAULT FALSE                        | Permission flag                |
| `can_view_reports`          | BOOLEAN         | DEFAULT TRUE                         | Permission flag                |
| `joined_at`                 | TIMESTAMPTZ     | DEFAULT now()                        |                                |
| `updated_at`                | TIMESTAMPTZ     | DEFAULT now(), ON UPDATE             |                                |
| `deleted_at`                | TIMESTAMPTZ     | NULL                                 | Soft delete (removes member)   |

**Member roles:** `admin` | `member` | `dependent` | `advisor`

---

## Table: transactions

Core financial records. Covers income, expenses, and transfers.

| Column                     | Type                      | Constraints                              | Description                       |
|----------------------------|---------------------------|------------------------------------------|-----------------------------------|
| `id`                       | UUID                      | PK                                       |                                   |
| `family_id`                | UUID                      | FK → families.id CASCADE, INDEX          |                                   |
| `user_id`                  | UUID                      | FK → users.id SET NULL, INDEX            | Who recorded it                   |
| `category_id`              | UUID                      | FK → categories.id SET NULL, NULL        |                                   |
| `recurring_transaction_id` | UUID                      | FK → recurring_transactions.id SET NULL  | Link to recurring template        |
| `type`                     | ENUM(TransactionType)     | NOT NULL                                 | income \| expense \| transfer     |
| `status`                   | ENUM(TransactionStatus)   | DEFAULT 'completed'                      |                                   |
| `amount`                   | NUMERIC(14,2)             | NOT NULL                                 | Always positive                   |
| `currency`                 | CHAR(3)                   | DEFAULT 'USD'                            |                                   |
| `description`              | VARCHAR(500)              | NOT NULL                                 | Transaction description           |
| `notes`                    | TEXT                      | NULL                                     | Additional notes                  |
| `merchant_name`            | VARCHAR(255)              | NULL                                     |                                   |
| `merchant_logo`            | VARCHAR(500)              | NULL                                     |                                   |
| `transaction_date`         | TIMESTAMPTZ               | NOT NULL, INDEX                          | Actual transaction date           |
| `created_at`               | TIMESTAMPTZ               | DEFAULT now()                            |                                   |
| `updated_at`               | TIMESTAMPTZ               | DEFAULT now(), ON UPDATE                 |                                   |
| `deleted_at`               | TIMESTAMPTZ               | NULL                                     | Soft delete                       |
| `receipt_url`              | VARCHAR(500)              | NULL                                     |                                   |
| `is_ocr_generated`         | BOOLEAN                   | DEFAULT FALSE                            | Was this created via OCR?         |
| `ai_category_confidence`   | NUMERIC(5,4)              | NULL                                     | AI categorisation confidence 0-1  |
| `is_anomaly`               | BOOLEAN                   | DEFAULT FALSE                            | Flagged by anomaly detection      |

**Indexes:**
```sql
ix_transactions_family_date     (family_id, transaction_date)
ix_transactions_family_type     (family_id, type)
ix_transactions_family_category (family_id, category_id)
```

**Transaction statuses:** `pending` | `completed` | `failed` | `cancelled`

---

## Table: categories

Transaction categories. `is_system = TRUE` categories are platform-wide defaults; family-specific categories have `family_id` set.

| Column      | Type         | Constraints                             | Description                     |
|-------------|--------------|------------------------------------------|---------------------------------|
| `id`        | UUID         | PK                                       |                                 |
| `family_id` | UUID         | FK → families.id CASCADE, NULL, INDEX    | NULL for system categories      |
| `name`      | VARCHAR(100) | NOT NULL                                 |                                 |
| `type`      | VARCHAR(20)  | NOT NULL                                 | income \| expense               |
| `icon`      | VARCHAR(10)  | NULL                                     | Emoji icon                      |
| `color`     | CHAR(7)      | NULL                                     | Hex color                       |
| `is_system` | BOOLEAN      | DEFAULT FALSE                            | Platform-default (undeleteable) |
| `created_at`| TIMESTAMPTZ  | DEFAULT now()                            |                                 |
| `deleted_at`| TIMESTAMPTZ  | NULL                                     |                                 |

---

## Table: budgets

Monthly spending limits per category per family.

| Column         | Type          | Constraints                      | Description          |
|----------------|---------------|----------------------------------|----------------------|
| `id`           | UUID          | PK                               |                      |
| `family_id`    | UUID          | FK → families.id CASCADE, INDEX  |                      |
| `category_id`  | UUID          | FK → categories.id CASCADE       |                      |
| `month`        | SMALLINT      | NOT NULL (1-12)                  | Budget month         |
| `year`         | SMALLINT      | NOT NULL                         | Budget year          |
| `limit_amount` | NUMERIC(14,2) | NOT NULL                         | Monthly limit        |
| `created_at`   | TIMESTAMPTZ   | DEFAULT now()                    |                      |
| `updated_at`   | TIMESTAMPTZ   | DEFAULT now(), ON UPDATE         |                      |

**Unique constraint:** `(family_id, category_id, year, month)`

---

## Table: savings_goals

Long-term savings milestones with progress tracking.

| Column           | Type              | Constraints                     | Description                       |
|------------------|-------------------|---------------------------------|-----------------------------------|
| `id`             | UUID              | PK                              |                                   |
| `family_id`      | UUID              | FK → families.id CASCADE, INDEX |                                   |
| `created_by`     | UUID              | FK → users.id SET NULL          |                                   |
| `name`           | VARCHAR(255)      | NOT NULL                        |                                   |
| `description`    | TEXT              | NULL                            |                                   |
| `icon`           | VARCHAR(10)       | NULL                            |                                   |
| `target_amount`  | NUMERIC(14,2)     | NOT NULL                        |                                   |
| `current_amount` | NUMERIC(14,2)     | DEFAULT 0.00                    | Running contribution total        |
| `currency`       | CHAR(3)           | DEFAULT 'USD'                   |                                   |
| `target_date`    | DATE              | NULL                            | Optional deadline                 |
| `priority`       | ENUM(GoalPriority)| DEFAULT 'medium'                | low \| medium \| high             |
| `status`         | ENUM(GoalStatus)  | DEFAULT 'active'                | active \| completed \| paused     |
| `is_fully_funded`| BOOLEAN           | DEFAULT FALSE                   | Auto-set when current >= target   |
| `created_at`     | TIMESTAMPTZ       | DEFAULT now()                   |                                   |
| `updated_at`     | TIMESTAMPTZ       | DEFAULT now(), ON UPDATE        |                                   |
| `deleted_at`     | TIMESTAMPTZ       | NULL                            |                                   |

---

## Table: recurring_transactions

Templates for auto-generating periodic transactions (salaries, subscriptions, rent).

| Column          | Type                      | Constraints                      | Description                    |
|-----------------|---------------------------|----------------------------------|--------------------------------|
| `id`            | UUID                      | PK                               |                                |
| `family_id`     | UUID                      | FK → families.id CASCADE, INDEX  |                                |
| `category_id`   | UUID                      | FK → categories.id SET NULL      |                                |
| `created_by`    | UUID                      | FK → users.id SET NULL           |                                |
| `type`          | VARCHAR(20)               | NOT NULL                         | income \| expense              |
| `amount`        | NUMERIC(14,2)             | NOT NULL                         |                                |
| `currency`      | CHAR(3)                   | DEFAULT 'USD'                    |                                |
| `description`   | VARCHAR(500)              | NOT NULL                         |                                |
| `frequency`     | ENUM(RecurrenceFrequency) | NOT NULL                         | daily..annually                |
| `start_date`    | DATE                      | NOT NULL                         |                                |
| `end_date`      | DATE                      | NULL                             | NULL = no end                  |
| `next_due_date` | DATE                      | NULL, INDEX                      | Indexed for Celery queries     |
| `is_active`     | BOOLEAN                   | DEFAULT TRUE                     |                                |
| `created_at`    | TIMESTAMPTZ               | DEFAULT now()                    |                                |
| `updated_at`    | TIMESTAMPTZ               | DEFAULT now(), ON UPDATE         |                                |
| `deleted_at`    | TIMESTAMPTZ               | NULL                             |                                |

**Frequencies:** `daily` | `weekly` | `biweekly` | `monthly` | `quarterly` | `annually`

---

## Table: ai_insights

AI-generated insights and alerts stored per family.

| Column          | Type        | Constraints                      | Description                         |
|-----------------|-------------|----------------------------------|-------------------------------------|
| `id`            | UUID        | PK                               |                                     |
| `family_id`     | UUID        | FK → families.id CASCADE, INDEX  |                                     |
| `insight_type`  | VARCHAR(50) | NOT NULL                         | spending_alert \| anomaly \| etc.   |
| `title`         | VARCHAR(255)| NOT NULL                         |                                     |
| `body`          | TEXT        | NOT NULL                         | Full insight text                   |
| `severity`      | VARCHAR(20) | DEFAULT 'info'                   | info \| warning \| critical         |
| `confidence`    | FLOAT       | NULL                             | Model confidence (0.0–1.0)          |
| `metadata`      | JSONB       | NULL                             | Arbitrary structured data           |
| `is_read`       | BOOLEAN     | DEFAULT FALSE                    |                                     |
| `created_at`    | TIMESTAMPTZ | DEFAULT now()                    |                                     |
| `expires_at`    | TIMESTAMPTZ | NULL                             | Auto-expire old insights            |

**Insight types:** `spending_alert` | `saving_opportunity` | `anomaly` | `milestone` | `prediction` | `monthly_summary`

---

## Table: notifications

User-facing notification inbox.

| Column       | Type        | Constraints                       | Description                    |
|--------------|-------------|-----------------------------------|--------------------------------|
| `id`         | UUID        | PK                                |                                |
| `user_id`    | UUID        | FK → users.id CASCADE, INDEX      |                                |
| `family_id`  | UUID        | FK → families.id CASCADE, NULL    |                                |
| `type`       | VARCHAR(50) | NOT NULL                          | bill_reminder \| budget_alert  |
| `title`      | VARCHAR(255)| NOT NULL                          |                                |
| `body`       | TEXT        | NOT NULL                          |                                |
| `action_url` | VARCHAR(500)| NULL                              | Deep-link to relevant page     |
| `data`       | JSONB       | NULL                              | Extra structured data          |
| `is_read`    | BOOLEAN     | DEFAULT FALSE                     |                                |
| `sent_at`    | TIMESTAMPTZ | NULL                              | When notification was sent     |
| `created_at` | TIMESTAMPTZ | DEFAULT now()                     |                                |
| `read_at`    | TIMESTAMPTZ | NULL                              |                                |

---

## Table: uploaded_files

Tracks all files uploaded to the platform (receipts, reports, avatars).

| Column             | Type         | Constraints                       | Description                    |
|--------------------|--------------|-----------------------------------|--------------------------------|
| `id`               | UUID         | PK                                |                                |
| `family_id`        | UUID         | FK → families.id CASCADE, INDEX   |                                |
| `uploaded_by`      | UUID         | FK → users.id SET NULL            |                                |
| `transaction_id`   | UUID         | FK → transactions.id SET NULL     | Associated transaction         |
| `filename`         | VARCHAR(255) | NOT NULL                          | Storage filename (UUID-prefixed)|
| `original_filename`| VARCHAR(255) | NOT NULL                          | User's original filename       |
| `content_type`     | VARCHAR(100) | NOT NULL                          | MIME type                      |
| `size_bytes`       | INTEGER      | NOT NULL                          |                                |
| `storage_path`     | VARCHAR(1000)| NOT NULL                          | Local path or S3 key           |
| `public_url`       | VARCHAR(1000)| NULL                              | CDN/public URL                 |
| `purpose`          | VARCHAR(50)  | DEFAULT 'receipt'                 | receipt \| report \| avatar    |
| `ocr_data`         | JSONB        | NULL                              | Extracted OCR fields           |
| `created_at`       | TIMESTAMPTZ  | DEFAULT now()                     |                                |
| `deleted_at`       | TIMESTAMPTZ  | NULL                              |                                |

---

## Table: reports

Tracks generated report files (PDF, Excel, CSV).

| Column           | Type         | Constraints                      | Description                        |
|------------------|--------------|----------------------------------|------------------------------------|
| `id`             | UUID         | PK                               |                                    |
| `family_id`      | UUID         | FK → families.id CASCADE, INDEX  |                                    |
| `generated_by`   | UUID         | FK → users.id SET NULL           |                                    |
| `report_type`    | VARCHAR(50)  | NOT NULL                         | monthly_summary \| tax \| etc.     |
| `title`          | VARCHAR(255) | NOT NULL                         |                                    |
| `format`         | VARCHAR(10)  | DEFAULT 'pdf'                    | pdf \| xlsx \| csv                 |
| `status`         | VARCHAR(20)  | DEFAULT 'pending'                | pending \| generating \| ready     |
| `storage_path`   | VARCHAR(1000)| NULL                             |                                    |
| `public_url`     | VARCHAR(1000)| NULL                             |                                    |
| `parameters`     | JSONB        | NULL                             | Generation parameters              |
| `error_message`  | VARCHAR(500) | NULL                             | Set on failure                     |
| `created_at`     | TIMESTAMPTZ  | DEFAULT now()                    |                                    |
| `completed_at`   | TIMESTAMPTZ  | NULL                             |                                    |
| `expires_at`     | TIMESTAMPTZ  | NULL                             | Auto-cleanup old reports           |
| `deleted_at`     | TIMESTAMPTZ  | NULL                             |                                    |

---

## Key Indexes Summary

```sql
-- Hot query paths explicitly indexed
CREATE INDEX ix_users_email                   ON users(email);
CREATE INDEX ix_family_members_family_id      ON family_members(family_id);
CREATE INDEX ix_family_members_user_id        ON family_members(user_id);
CREATE INDEX ix_transactions_family_date      ON transactions(family_id, transaction_date DESC);
CREATE INDEX ix_transactions_family_type      ON transactions(family_id, type);
CREATE INDEX ix_transactions_family_category  ON transactions(family_id, category_id);
CREATE INDEX ix_categories_family_id          ON categories(family_id);
CREATE INDEX ix_savings_goals_family_id       ON savings_goals(family_id);
CREATE INDEX ix_budgets_family_id             ON budgets(family_id);
CREATE INDEX ix_notifications_user_id         ON notifications(user_id);
CREATE INDEX ix_recurring_next_due_date       ON recurring_transactions(next_due_date)
             WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX ix_ai_insights_family_id         ON ai_insights(family_id);

-- Full-text search on transaction descriptions
CREATE INDEX ix_transactions_description_trgm
             ON transactions USING gin(description gin_trgm_ops);
```

---

## Migration Workflow

```bash
# After changing a model:
alembic revision --autogenerate -m "add invoice_number to transactions"

# Review generated migration before applying
cat backend/app/database/migrations/versions/<revision>.py

# Apply to database
alembic upgrade head

# Rollback one step
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# View migration history
alembic history --verbose
```
