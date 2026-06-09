/**
 * types/auth.ts
 */
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  full_name: string
  email: string
  password: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export type UserRole = 'super_admin' | 'family_admin' | 'member' | 'dependent' | 'advisor'

/**
 * types/transaction.ts
 */
export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface Transaction {
  id: string
  family_id: string
  user_id: string | null
  category_id: string | null
  type: TransactionType
  status: TransactionStatus
  amount: string  // Decimal as string to preserve precision
  currency: string
  description: string
  notes: string | null
  merchant_name: string | null
  transaction_date: string
  receipt_url: string | null
  is_anomaly: boolean
  is_ocr_generated: boolean
  created_at: string
}

export interface TransactionCreate {
  type: TransactionType
  amount: number
  currency?: string
  description: string
  notes?: string
  category_id?: string
  transaction_date: string
  merchant_name?: string
}

export interface PaginatedTransactions {
  items: Transaction[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * types/analytics.ts
 */
export interface MonthlyTrend {
  month: string   // "2024-10"
  income: string
  expenses: string
  net: string
  savings_rate: number
}

export interface CategoryBreakdown {
  category_id: string | null
  category_name: string
  total: string
  percentage: number
  transaction_count: number
}

export interface DashboardSummary {
  total_income: string
  total_expenses: string
  net_savings: string
  savings_rate: number
  income_change_pct: number
  expense_change_pct: number
  monthly_trends: MonthlyTrend[]
  category_breakdown: CategoryBreakdown[]
  financial_health_score: number
}

export interface FinancialHealthScore {
  score: number
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  savings_rate_score: number
  debt_to_income_score: number
  liquidity_score: number
  trend_score: number
  recommendations: string[]
}

export interface SpendingForecast {
  month: string
  predicted_expenses: string
  confidence_interval_low: string
  confidence_interval_high: string
  model_used: string
}

/**
 * types/user.ts (extended)
 */
export interface FamilyMember {
  id: string
  user_id: string
  family_id: string
  role: 'admin' | 'member' | 'dependent' | 'advisor'
  display_name: string | null
  color: string | null
  can_view_all_transactions: boolean
  can_add_transactions: boolean
  can_manage_budgets: boolean
  can_invite_members: boolean
  can_view_reports: boolean
  joined_at: string
}

export interface SavingsGoal {
  id: string
  family_id: string
  name: string
  description: string | null
  icon: string | null
  target_amount: string
  current_amount: string
  currency: string
  target_date: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  is_fully_funded: boolean
  progress_pct: number
  created_at: string
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

export interface AIRecommendation {
  type: string
  severity: 'low' | 'medium' | 'high'
  title: string
  body: string
  action: string
}
