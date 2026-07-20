import {
  Bolt,
  BookOpen,
  Car,
  Clapperboard,
  Cloud,
  Coffee,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Lightbulb,
  Music,
  Phone,
  Plane,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tv,
  Utensils,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { BillingPeriod, ExpenseType, Importance } from '@/lib/types'

export const billingPeriodOptions: Array<{
  value: BillingPeriod
}> = [
  { value: 'monthly' },
  { value: 'yearly' },
  { value: 'oneTime' },
]

export const expenseTypeOptions: Array<{
  value: ExpenseType
}> = [
  { value: 'subscription' },
  { value: 'utility' },
]

export const importanceOptions: Array<{
  value: Importance
}> = [
  { value: 'essential' },
  { value: 'useful' },
  { value: 'cancelSoon' },
]

export const expenseIconOptions: Array<{
  value: string
  icon: LucideIcon
}> = [
  { value: 'receipt', icon: ReceiptText },
  { value: 'home', icon: Home },
  { value: 'bolt', icon: Bolt },
  { value: 'lightbulb', icon: Lightbulb },
  { value: 'wifi', icon: Wifi },
  { value: 'phone', icon: Phone },
  { value: 'smartphone', icon: Smartphone },
  { value: 'tv', icon: Tv },
  { value: 'music', icon: Music },
  { value: 'cloud', icon: Cloud },
  { value: 'shield', icon: ShieldCheck },
  { value: 'landmark', icon: Landmark },
  { value: 'car', icon: Car },
  { value: 'plane', icon: Plane },
  { value: 'utensils', icon: Utensils },
  { value: 'coffee', icon: Coffee },
  { value: 'shopping', icon: ShoppingBag },
  { value: 'health', icon: HeartPulse },
  { value: 'fitness', icon: Dumbbell },
  { value: 'education', icon: GraduationCap },
  { value: 'books', icon: BookOpen },
  { value: 'gaming', icon: Gamepad2 },
  { value: 'movies', icon: Clapperboard },
  { value: 'tools', icon: Wrench },
]

export function getExpenseIcon(iconValue: string) {
  return (
    expenseIconOptions.find((option) => option.value === iconValue)?.icon ??
    ReceiptText
  )
}
