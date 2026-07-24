export type BillingPeriod = 'monthly' | 'yearly' | 'oneTime'
export type Importance = 'essential' | 'useful' | 'cancelSoon'
export type ExpenseType = 'subscription' | 'utility'
export type Currency = 'eur' | 'usd' | 'gbp'

export type Expense = {
  id: string
  userId: string
  name: string
  defaultAmount: string
  billingPeriod: BillingPeriod
  dueDate: string
  importance: Importance
  type: ExpenseType
  icon: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ExpenseSummary = Pick<
  Expense,
  | 'id'
  | 'name'
  | 'defaultAmount'
  | 'billingPeriod'
  | 'dueDate'
  | 'type'
  | 'icon'
>

export type ExpensePayment = {
  id: string
  expenseId: string
  userId: string
  periodMonth: number
  periodYear: number
  paidAt: string
  amountSnapshot: string
}

export type ExpenseDetails = Expense & {
  payments: ExpensePayment[]
}

export type DashboardSummary = {
  period: {
    month: number
    year: number
  }
  totals: {
    planned: string
    paid: string
    remaining: string
    projected: string
  }
  counts: {
    total: number
    paid: number
    unpaid: number
  }
  paidExpenses: Array<{
    expense: ExpenseSummary
    payment: {
      id: string
      amountSnapshot: string
      paidAt: string
    }
    amount: string
  }>
  unpaidExpenses: Array<{
    expense: ExpenseSummary
    expectedAmount: string
  }>
}
