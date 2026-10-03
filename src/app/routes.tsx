import { createBrowserRouter } from 'react-router'
import { AppShell } from './AppShell'
import { Placeholder, Screen } from '@/shared/ui/Screen'
import { AddSheet } from '@/features/transactions/AddSheet'
import { SettingsScreen } from '@/features/settings/SettingsScreen'
import { AccountsScreen } from '@/features/accounts/AccountsScreen'
import { CategoriesScreen } from '@/features/categories/CategoriesScreen'

/** Screens arrive feature by feature; these stand in until they do. */
const stub = (title: string, kicker: string, text: string, settings = false) => (
  <Screen title={title} kicker={kicker} settings={settings}>
    <Placeholder text={text} />
  </Screen>
)

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        index: true,
        element: stub(
          'Обзор',
          'Октябрь 2026 · BYN',
          'Виджеты баланса, расходов\nи бюджетов появятся здесь',
          true,
        ),
      },
      {
        path: 'transactions',
        element: stub('Операции', 'История', 'Список с поиском\nи фильтрами'),
      },
      {
        path: 'budget',
        element: stub('Бюджет', 'Октябрь 2026', 'Конверты, лимиты,\nцели накоплений'),
      },
      {
        path: 'analytics',
        element: stub('Аналитика', 'Куда уходят деньги', 'Графики по категориям\nи периодам'),
      },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'accounts', element: <AccountsScreen /> },
      { path: 'categories', element: <CategoriesScreen /> },
    ],
  },
  { path: 'add', element: <AddSheet /> },
])
