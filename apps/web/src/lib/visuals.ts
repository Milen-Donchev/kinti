import type { BillingPeriod, ExpenseType, Importance } from '@/lib/types'

export const visualTones = [
  {
    bg: 'bg-[#29c776] text-white shadow-[0_4px_0_#16a063]',
    soft: 'bg-[#ddfbea] dark:bg-[#153a2b]',
    border: 'border-[#29c776]',
    glow: 'shadow-[#29c776]/20',
  },
  {
    bg: 'bg-[#35b9ff] text-white shadow-[0_4px_0_#1688c7]',
    soft: 'bg-[#e2f6ff] dark:bg-[#15334a]',
    border: 'border-[#35b9ff]',
    glow: 'shadow-[#35b9ff]/20',
  },
  {
    bg: 'bg-[#b77dff] text-white shadow-[0_4px_0_#8e58d1]',
    soft: 'bg-[#f0e4ff] dark:bg-[#32224d]',
    border: 'border-[#b77dff]',
    glow: 'shadow-[#b77dff]/20',
  },
  {
    bg: 'bg-[#ff6b7a] text-white shadow-[0_4px_0_#d64b58]',
    soft: 'bg-[#ffe4e8] dark:bg-[#4f232c]',
    border: 'border-[#ff6b7a]',
    glow: 'shadow-[#ff6b7a]/20',
  },
  {
    bg: 'bg-[#ffd45a] text-slate-950 shadow-[0_4px_0_#d39d24]',
    soft: 'bg-[#fff4ce] dark:bg-[#493919]',
    border: 'border-[#ffd45a]',
    glow: 'shadow-[#ffd45a]/20',
  },
  {
    bg: 'bg-[#24d6c5] text-white shadow-[0_4px_0_#0ea493]',
    soft: 'bg-[#ddfcf8] dark:bg-[#123f3c]',
    border: 'border-[#24d6c5]',
    glow: 'shadow-[#24d6c5]/20',
  },
] as const

const iconToneIndexes: Record<string, number> = {
  receipt: 0,
  home: 1,
  bolt: 4,
  lightbulb: 4,
  wifi: 1,
  phone: 5,
  smartphone: 5,
  tv: 2,
  music: 2,
  cloud: 1,
  shield: 0,
  landmark: 5,
  car: 3,
  plane: 1,
  utensils: 4,
  coffee: 3,
  shopping: 2,
  health: 3,
  fitness: 0,
  education: 1,
  books: 5,
  gaming: 2,
  movies: 2,
  tools: 4,
}

export function getIconTone(icon: string) {
  return visualTones[iconToneIndexes[icon] ?? 0]
}

export function getBillingPeriodTone(period: BillingPeriod) {
  if (period === 'oneTime') {
    return visualTones[3]
  }

  if (period === 'yearly') {
    return visualTones[2]
  }

  return visualTones[0]
}

export function getExpenseTypeTone(type: ExpenseType) {
  return type === 'utility' ? visualTones[4] : visualTones[1]
}

export function getImportanceTone(importance: Importance) {
  if (importance === 'essential') {
    return visualTones[3]
  }

  if (importance === 'cancelSoon') {
    return visualTones[4]
  }

  return visualTones[0]
}
