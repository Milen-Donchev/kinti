const routePreloaders: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/routes/dashboard-page'),
  '/expenses': () => import('@/routes/expenses-page'),
  '/calendar': () => import('@/routes/calendar-page'),
  '/settings': () => import('@/routes/settings-page'),
}

export function prefetchRoute(path: string) {
  void routePreloaders[path]?.()
}
