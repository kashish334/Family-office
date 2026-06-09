export const transactions = [
  { id: 1, date: 'Oct 24, 2024', description: 'Whole Foods Market', category: 'Grocery', member: 'Julian', amount: -245.50 },
  { id: 2, date: 'Oct 23, 2024', description: 'Shell Petroleum', category: 'Transport', member: 'Julian', amount: -82.00 },
  { id: 3, date: 'Oct 22, 2024', description: 'Sterling Dividends', category: 'Investment', member: 'Trust', amount: 1120.00 },
  { id: 4, date: 'Oct 21, 2024', description: 'Apple Subscription', category: 'Entertainment', member: 'Julian', amount: -14.99 },
  { id: 5, date: 'Oct 24, 2024', description: 'The Ledbury Fine Dining', category: 'Food', member: 'Arthur', amount: -1240.00 },
  { id: 6, date: 'Oct 22, 2024', description: 'Quarterly Portfolio Dividend', category: 'Income', member: 'The Trust', amount: 14500.00 },
  { id: 7, date: 'Oct 21, 2024', description: 'Harley Street Medical Center', category: 'Medical', member: 'Clarissa', amount: -850.00 },
  { id: 8, date: 'Oct 18, 2024', description: 'Lufthansa First Class', category: 'Travel', member: 'Arthur', amount: -4280.00 },
  { id: 9, date: 'Oct 15, 2024', description: 'Selfridges & Co.', category: 'Shopping', member: 'Clarissa', amount: -2100.00 },
  { id: 10, date: 'Oct 12, 2024', description: 'Executive Salary', category: 'Income', member: 'Julian', amount: 18500.00 },
];

export const monthlyData = [
  { month: 'Jan', income: 18000, expenses: 10000 },
  { month: 'Feb', income: 19000, expenses: 11500 },
  { month: 'Mar', income: 17500, expenses: 9800 },
  { month: 'Apr', income: 21000, expenses: 12000 },
  { month: 'May', income: 20000, expenses: 10500 },
  { month: 'Jun', income: 22000, expenses: 11000 },
  { month: 'Jul', income: 21500, expenses: 10800 },
  { month: 'Aug', income: 23000, expenses: 12500 },
  { month: 'Sep', income: 24000, expenses: 11800 },
  { month: 'Oct', income: 25000, expenses: 13000 },
  { month: 'Nov', income: 24500, expenses: 12200 },
  { month: 'Dec', income: 26000, expenses: 14000 },
];

export const savingsGrowth = [
  { month: 'Jan', value: 180000 },
  { month: 'Mar', value: 195000 },
  { month: 'Jun', value: 210000 },
  { month: 'Sep', value: 230000 },
  { month: 'Dec', value: 248500 },
];

export const expenseBreakdown = [
  { name: 'Housing', value: 45, color: '#5a7a5e' },
  { name: 'Transport', value: 25, color: '#c9a96e' },
  { name: 'Food', value: 15, color: '#9a9a90' },
  { name: 'Other', value: 15, color: '#dddbd5' },
];

export const recurringIncome = [
  { source: 'Executive Salary', subtitle: 'Global Holdings Ltd.', frequency: 'Monthly', next: 'Oct 28, 2024', amount: 18500, status: 'Active' },
  { source: 'Equity Dividends', subtitle: 'Vanguard Tech Fund', frequency: 'Quarterly', next: 'Nov 15, 2024', amount: 4250, status: 'Active' },
  { source: 'Rental Income', subtitle: 'The Highline Residences', frequency: 'Monthly', next: 'Oct 01, 2024', amount: 8900, status: 'Pending' },
];

export const bills = [
  { date: 'OCT 28', name: 'Concierge Service', amount: 250, overdue: false },
  { date: 'OCT 30', name: 'Insurance Premium', amount: 1840, overdue: true },
  { date: 'NOV 05', name: 'Yacht Club Dues', amount: 4500, overdue: false },
];

export const savingsGoals = [
  { name: 'House Fund', subtitle: 'Pacific Heights Estate Acquisition', current: 450000, target: 700000, priority: 'High Priority' },
  { name: 'Family Trip', subtitle: 'Italian Riviera Summer 2025', current: 8000, target: 20000, priority: null },
  { name: 'Emergency Fund', subtitle: '12 Months of Living Expenses (Secured)', current: 120000, target: 120000, status: 'FULLY FUNDED' },
];

export const budgetCategories = [
  { name: 'Housing', icon: '🏠', limit: 3200, actual: 3100, status: 'on-track' },
  { name: 'Food & Dining', icon: '🍽️', limit: 850, actual: 970, status: 'over' },
  { name: 'Entertainment', icon: '🎬', limit: 400, actual: 320, status: 'saving' },
  { name: 'Transport', icon: '🚗', limit: 600, actual: 590, status: 'on-track' },
  { name: 'Wealth Accumulation', icon: '💎', limit: 3450, actual: 3450, status: 'on-track' },
];

export const chatMessages = [
  {
    role: 'ai',
    content: "Good morning, Alexander. I've finished analyzing your portfolio's performance for the current quarter. Your net worth has increased by 4.2% since June, primarily driven by the consistent performance of your equity holdings.\n\nWould you like to review your suggested rebalancing strategy or discuss the impact of the latest market shifts on your \"Villa in Tuscany\" savings goal?"
  },
  {
    role: 'user',
    content: 'Let\'s look at the "Villa in Tuscany" goal. Am I still on track for a 2026 purchase? Analyze my last month of spending to see if it affected the timeline.'
  },
  {
    role: 'ai',
    content: "Analyzing your last month's cash flow... I see a slight 12% uptick in discretionary spending (mostly dining and lifestyle), but it's offset by the $2,500 bonus deposit from last Tuesday.",
    metrics: { savingsImpact: '+$420.00', timeline: 'Oct 2026', timelineStatus: 'Stable' },
    followup: 'You are still 100% on track. In fact, if we redirect that surplus $420 into the high-yield escrow account, we could shave 1 month off the timeline.'
  }
];
