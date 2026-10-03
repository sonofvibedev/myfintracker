import { createBrowserRouter } from 'react-router'
import { AppShell } from './AppShell'
import { OverviewScreen } from '@/features/overview/OverviewScreen'
import { BudgetScreen } from '@/features/budget/BudgetScreen'
import { AnalyticsScreen } from '@/features/analytics/AnalyticsScreen'
import { AddSheet } from '@/features/transactions/AddSheet'
import { TransactionsScreen } from '@/features/transactions/TransactionsScreen'
import { SettingsScreen } from '@/features/settings/SettingsScreen'
import { AccountsScreen } from '@/features/accounts/AccountsScreen'
import { CategoriesScreen } from '@/features/categories/CategoriesScreen'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewScreen /> },
      { path: 'transactions', element: <TransactionsScreen /> },
      { path: 'budget', element: <BudgetScreen /> },
      { path: 'analytics', element: <AnalyticsScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'accounts', element: <AccountsScreen /> },
      { path: 'categories', element: <CategoriesScreen /> },
    ],
  },
  { path: 'add', element: <AddSheet /> },
])
