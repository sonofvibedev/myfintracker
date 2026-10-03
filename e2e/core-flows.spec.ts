import { expect, test, type Page } from '@playwright/test'

/** Each test starts from an empty database so one test cannot colour another. */
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('myfintracker')
      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
      request.onblocked = () => resolve()
    })
    localStorage.clear()
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Обзор' })).toBeVisible()
})

async function addTransaction(page: Page, digits: string[], type?: 'Доход' | 'Перевод') {
  await page.getByRole('button', { name: 'Добавить операцию' }).click()
  await expect(page.getByRole('heading', { name: 'Новая операция' })).toBeVisible()

  if (type) await page.getByRole('button', { name: type, exact: true }).click()
  for (const d of digits) await page.getByRole('button', { name: d, exact: true }).click()

  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page).toHaveURL(/\/transactions/)
}

test('seeds a usable database on first run', async ({ page }) => {
  await page.goto('/accounts')
  await expect(page.getByText('Наличные').first()).toBeVisible()
  await expect(page.getByText('Карта').first()).toBeVisible()

  await page.goto('/categories')
  await expect(page.getByText('Продукты')).toBeVisible()
  await expect(page.getByText('Транспорт')).toBeVisible()
})

test('records an expense and reflects it in the balance', async ({ page }) => {
  await addTransaction(page, ['4', '8', ',', '7', '0'])

  await expect(page.getByText('Сегодня')).toBeVisible()
  await expect(page.getByText('−48,70').first()).toBeVisible()

  await page.goto('/accounts')
  // Intl picks its own minus sign, so match either shape.
  await expect(page.getByText(/[-−]48,70/).first()).toBeVisible()
})

test('income and expense net out across screens', async ({ page }) => {
  await addTransaction(page, ['1', '4', '5', '0'], 'Доход')
  await addTransaction(page, ['5', '0'])

  await page.goto('/accounts')
  await expect(page.getByText('1 400,00').first()).toBeVisible()

  await page.goto('/analytics')
  await expect(page.getByText('50,00').first()).toBeVisible()
  await expect(page.getByText('1 450,00').first()).toBeVisible()
})

test('an envelope tracks what is left and warns when it is overspent', async ({ page }) => {
  await addTransaction(page, ['1', '0', '0', '0'], 'Доход')
  await addTransaction(page, ['6', '0'])

  await page.goto('/budget')
  await page.getByRole('button', { name: 'Добавить', exact: true }).click()
  await page.getByRole('dialog').getByPlaceholder('400,00').fill('50')
  await page.getByRole('button', { name: 'Создать конверт' }).click()

  // 60 spent against a 50 limit: the envelope is 10 over.
  await expect(page.getByText('перерасход')).toBeVisible()
  await expect(page.getByText('10,00').first()).toBeVisible()
})

test('the data survives a reload', async ({ page }) => {
  await addTransaction(page, ['9', '9'])
  await page.reload()
  await expect(page.getByText('−99,00').first()).toBeVisible()
})

test('settings switch the theme and keep the choice', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Тёмная' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('export offers a JSON file', async ({ page }) => {
  await addTransaction(page, ['1', '2'])

  await page.goto('/settings')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Экспорт JSON' }).click()

  const file = await download
  expect(file.suggestedFilename()).toMatch(/^myfintracker-\d{4}-\d{2}-\d{2}\.json$/)
})
