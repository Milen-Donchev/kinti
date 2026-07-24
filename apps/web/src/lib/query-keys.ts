export type PeriodKey = {
  month: number
  year: number
}

export const queryKeys = {
  dashboardSummaries: () => ['dashboard-summary'] as const,
  dashboardSummary: (period: PeriodKey) =>
    ['dashboard-summary', period.year, period.month] as const,
  expenses: () => ['expenses'] as const,
  expensesDueAll: () => ['expenses-due'] as const,
  expensesDue: (period: PeriodKey) =>
    ['expenses-due', period.year, period.month] as const,
  expense: (expenseId: string) => ['expense', expenseId] as const,
  payments: (period: PeriodKey) =>
    ['payments', period.year, period.month] as const,
}
