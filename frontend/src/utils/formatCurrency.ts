/**
 * utils/formatCurrency.ts
 */
export function formatCurrency(
  amount: string | number,
  currency = 'USD',
  compact = false,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'

  if (compact && Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`
  }
  if (compact && Math.abs(num) >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}k`
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatPct(value: number, showSign = false): string {
  const sign = showSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}


/**
 * utils/dateUtils.ts
 */
export function formatDate(iso: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = new Date(iso)
  const options: Intl.DateTimeFormatOptions =
    format === 'short'  ? { month: 'short', day: 'numeric' } :
    format === 'long'   ? { year: 'numeric', month: 'long', day: 'numeric' } :
                          { year: 'numeric', month: 'short', day: 'numeric' }
  return d.toLocaleDateString('en-US', options)
}

export function formatMonth(yearMonth: string): string {
  // "2024-10" → "Oct 2024"
  const [year, month] = yearMonth.split('-')
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric'
  })
}

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function monthsAgo(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d
}

export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0]
}


/**
 * utils/chartHelpers.ts
 */
export const CHART_COLORS = {
  sage:     '#5a7a5e',
  sageDark: '#3d5c41',
  gold:     '#c9a96e',
  red:      '#c94a3a',
  muted:    '#9a9a90',
  border:   '#dddbd5',
}

export function tooltipFormatter(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return formatCurrency(num)
}

export function gradientDef(id: string, color: string) {
  return `
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="${color}" stopOpacity="0.15"/>
        <stop offset="95%" stopColor="${color}" stopOpacity="0.01"/>
      </linearGradient>
    </defs>
  `
}


/**
 * utils/constants.ts
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'Grocery':          '#e8f0e9',
  'Transport':        '#f0ede8',
  'Investment':       '#d8f0e8',
  'Entertainment':    '#f5e8e8',
  'Income':           '#d8f0e8',
  'Food & Dining':    '#f0ede8',
  'Healthcare':       '#fef2f2',
  'Travel':           '#e8eaf5',
  'Shopping':         '#f5f0e8',
  'Housing':          '#e8f0e9',
  'Education':        '#f0f0fa',
  'Utilities':        '#f5f5e8',
  'Memberships':      '#f0e8f5',
  'Philanthropy':     '#fce8e8',
}

export const MEMBER_ROLE_LABELS: Record<string, string> = {
  admin:     'Admin',
  member:    'Member',
  dependent: 'Dependent',
  advisor:   'Advisor',
}

export const GOAL_PRIORITY_COLORS: Record<string, string> = {
  high:   '#fef2f2',
  medium: '#f5edd8',
  low:    '#e8f0e9',
}
