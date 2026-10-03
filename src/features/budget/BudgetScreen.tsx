import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '@/shared/ui/Screen'
import { Button, ColorPicker, Field, IconPicker, Select, Sheet } from '@/shared/ui/kit'
import {
  useBudgets,
  useCategories,
  useDeleteBudget,
  useDeleteGoal,
  useGoals,
  useSaveBudget,
  useSaveGoal,
  useSettings,
  useTransactions,
} from '@/shared/lib/queries'
import { formatMoney, parseAmount, toMajor } from '@/shared/lib/money'
import { budgetStatus, unallocated } from '@/shared/lib/budget'
import { filterByRange, rangeOf, totals } from '@/shared/lib/period'
import type { Budget, Goal } from '@/shared/lib/types'

const localDate = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)

const blankBudget = { categoryId: '', limit: '', period: 'month' as const, rollover: true }
const blankGoal = { name: '', target: '', saved: '', deadline: '', icon: '🎯', color: '#4fb8a8' }

export function BudgetScreen() {
  const { data: budgets = [] } = useBudgets()
  const { data: goals = [] } = useGoals()
  const { data: categories = [] } = useCategories('expense')
  const { data: transactions = [] } = useTransactions()
  const { data: settings } = useSettings()

  const saveBudget = useSaveBudget()
  const removeBudget = useDeleteBudget()
  const saveGoal = useSaveGoal()
  const removeGoal = useDeleteGoal()

  const base = settings?.baseCurrency ?? 'BYN'
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const statuses = useMemo(() => budgetStatus(budgets, transactions), [budgets, transactions])
  const monthIncome = useMemo(
    () => totals(filterByRange(transactions, rangeOf('month'))).income,
    [transactions],
  )
  const left = unallocated(budgets, monthIncome)

  const [budgetSheet, setBudgetSheet] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [budgetForm, setBudgetForm] = useState(blankBudget)
  const [budgetError, setBudgetError] = useState('')

  const [goalSheet, setGoalSheet] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [goalForm, setGoalForm] = useState(blankGoal)
  const [goalError, setGoalError] = useState('')

  const spare = useMemo(
    () => categories.filter((c) => !budgets.some((b) => b.categoryId === c.id)),
    [categories, budgets],
  )

  const openBudget = (budget?: Budget) => {
    setEditingBudget(budget ?? null)
    setBudgetForm(
      budget
        ? {
            categoryId: budget.categoryId,
            limit: String(toMajor(budget.limit)).replace('.', ','),
            period: budget.period as 'month',
            rollover: budget.rollover,
          }
        : { ...blankBudget, categoryId: spare[0]?.id ?? '' },
    )
    setBudgetError('')
    setBudgetSheet(true)
  }

  const submitBudget = async () => {
    const limit = parseAmount(budgetForm.limit)
    if (!budgetForm.categoryId) return setBudgetError('Выбери категорию')
    if (limit === null || limit <= 0) return setBudgetError('Лимит должен быть больше нуля')

    await saveBudget.mutateAsync([
      {
        ...editingBudget,
        categoryId: budgetForm.categoryId,
        limit,
        period: budgetForm.period,
        rollover: budgetForm.rollover,
        startsOn: editingBudget?.startsOn ?? localDate(new Date()),
      },
    ])
    setBudgetSheet(false)
  }

  const openGoal = (goal?: Goal) => {
    setEditingGoal(goal ?? null)
    setGoalForm(
      goal
        ? {
            name: goal.name,
            target: String(toMajor(goal.target)).replace('.', ','),
            saved: String(toMajor(goal.saved)).replace('.', ','),
            deadline: goal.deadline ?? '',
            icon: goal.icon,
            color: goal.color,
          }
        : blankGoal,
    )
    setGoalError('')
    setGoalSheet(true)
  }

  const submitGoal = async () => {
    const target = parseAmount(goalForm.target)
    const saved = parseAmount(goalForm.saved || '0')
    if (!goalForm.name.trim()) return setGoalError('Введи название')
    if (target === null || target <= 0) return setGoalError('Цель должна быть больше нуля')
    if (saved === null || saved < 0) return setGoalError('Накоплено — не число')

    await saveGoal.mutateAsync([
      {
        ...editingGoal,
        name: goalForm.name.trim(),
        target,
        saved,
        deadline: goalForm.deadline || null,
        icon: goalForm.icon,
        color: goalForm.color,
      },
    ])
    setGoalSheet(false)
  }

  return (
    <Screen
      title="Бюджет"
      kicker={new Intl.DateTimeFormat('ru-BY', { month: 'long', year: 'numeric' }).format(new Date())}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.33, 1, 0.3, 1] }}
        className="bg-tx relative overflow-hidden rounded-[4px_20px_20px_20px] p-5"
        style={{ color: 'var(--bg)' }}
      >
        <p className="text-[11.5px] tracking-widest uppercase opacity-65">
          {left >= 0 ? 'Не распределено' : 'Распределено сверх дохода'}
        </p>
        <p className="num mt-1.5 text-[32px] leading-none font-extrabold tracking-tight">
          {formatMoney(Math.abs(left), base)}
        </p>
        <p className="mt-1.5 text-[12.5px] opacity-70">
          {budgets.length === 0
            ? 'Заведи первый конверт — и каждый рубль получит задачу'
            : left >= 0
              ? `Доход за месяц ${formatMoney(monthIncome, base)}, в конвертах ${formatMoney(monthIncome - left, base)}`
              : 'Лимиты превышают доход этого месяца'}
        </p>
      </motion.div>

      <div className="mt-6 mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-[17px] font-bold tracking-tight">Конверты</h2>
        <button
          type="button"
          onClick={() => openBudget()}
          className="text-accent cursor-pointer text-[12.5px] font-semibold"
        >
          Добавить
        </button>
      </div>

      {statuses.length === 0 && (
        <p className="text-tx-2 py-6 text-center text-sm">Конвертов пока нет</p>
      )}

      <ul className="flex flex-col gap-2.5">
        {statuses.map(({ budget, spent, available, left: remaining, share, over, carried }, i) => {
          const category = categoryById.get(budget.categoryId)
          if (!category) return null

          return (
            <motion.li
              key={budget.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.45, ease: [0.33, 1, 0.3, 1] }}
            >
              <button
                type="button"
                onClick={() => openBudget(budget)}
                className="bg-card w-full cursor-pointer rounded-[3px_16px_16px_16px] border p-4 text-left shadow-[var(--sh-2)] transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-[0.99]"
                style={{ borderColor: over ? 'var(--down)' : 'var(--line)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 flex-none place-items-center rounded-md text-base"
                    style={{ background: `color-mix(in srgb, ${category.color} 16%, transparent)` }}
                  >
                    {category.icon}
                  </span>
                  <span className="flex-1 truncate text-[14.5px] font-semibold">
                    {category.name}
                    {budget.rollover && (
                      <span className="text-tx-2 ml-1.5 text-[10px] font-bold tracking-wider uppercase">
                        конверт
                      </span>
                    )}
                  </span>
                  <span className="text-right">
                    <span
                      className="num block text-[15px] font-bold tracking-tight"
                      style={{ color: over ? 'var(--down)' : undefined }}
                    >
                      {formatMoney(Math.abs(remaining), base)}
                    </span>
                    <span className="text-tx-2 text-[11px]">
                      {over ? 'перерасход' : 'осталось'}
                    </span>
                  </span>
                </div>

                <div className="bg-card-2 mt-3 h-2 overflow-hidden rounded-full">
                  <motion.i
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(share, 1) * 100}%` }}
                    transition={{ delay: 0.15 + i * 0.05, duration: 0.8, ease: [0.33, 1, 0.3, 1] }}
                    className="block h-full rounded-full"
                    style={{ background: over ? 'var(--down)' : category.color }}
                  />
                </div>

                <div className="text-tx-2 mt-2 flex justify-between text-[11.5px]">
                  <span className="num">
                    {formatMoney(spent, base)} из {formatMoney(available, base)}
                  </span>
                  {carried !== 0 && (
                    <span className="num">
                      {carried > 0 ? 'перенесено +' : 'долг '}
                      {formatMoney(Math.abs(carried), base)}
                    </span>
                  )}
                </div>
              </button>
            </motion.li>
          )
        })}
      </ul>

      <div className="mt-6 mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-[17px] font-bold tracking-tight">Копилки и цели</h2>
        <button
          type="button"
          onClick={() => openGoal()}
          className="text-accent cursor-pointer text-[12.5px] font-semibold"
        >
          Новая цель
        </button>
      </div>

      {goals.length === 0 && <p className="text-tx-2 py-6 text-center text-sm">Целей пока нет</p>}

      <ul className="flex flex-col gap-2.5">
        {goals.map((goal, i) => {
          const share = goal.target > 0 ? goal.saved / goal.target : 0
          const monthsLeft = goal.deadline
            ? Math.max(
                1,
                Math.round(
                  (new Date(goal.deadline).getTime() - Date.now()) / (30.44 * 86_400_000),
                ),
              )
            : null
          const perMonth = monthsLeft ? Math.max(0, goal.target - goal.saved) / monthsLeft : null

          return (
            <motion.li
              key={goal.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.45, ease: [0.33, 1, 0.3, 1] }}
            >
              <button
                type="button"
                onClick={() => openGoal(goal)}
                className="border-line bg-card flex w-full cursor-pointer items-center gap-3.5 rounded-lg border border-dashed p-4 text-left transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-[0.99]"
              >
                <span className="border-tx bg-card-2 relative h-16 w-13 flex-none overflow-hidden rounded-[6px_6px_14px_14px] border-2">
                  <motion.i
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(share, 1) * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 1, ease: [0.33, 1, 0.3, 1] }}
                    className="absolute inset-x-0 bottom-0 block"
                    style={{ background: goal.color }}
                  />
                  <span className="bg-tx absolute inset-x-[-2px] top-0 block h-1.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold">
                    {goal.icon} {goal.name}
                  </span>
                  <span className="text-tx-2 num block text-[12px]">
                    {formatMoney(goal.saved, base)} из {formatMoney(goal.target, base)}
                    {goal.deadline && ` · к ${goal.deadline}`}
                  </span>
                  {perMonth !== null && perMonth > 0 && (
                    <span
                      className="mt-1.5 block border-l-2 pl-2 text-[11.5px] italic"
                      style={{ borderColor: goal.color, color: 'var(--tx-2)' }}
                    >
                      {formatMoney(Math.round(perMonth), base)} в месяц, чтобы успеть
                    </span>
                  )}
                </span>
                <span className="font-display num text-[19px] font-bold tracking-tight">
                  {Math.round(share * 100)}%
                </span>
              </button>
            </motion.li>
          )
        })}
      </ul>

      <Sheet
        open={budgetSheet}
        onClose={() => setBudgetSheet(false)}
        title={editingBudget ? 'Конверт' : 'Новый конверт'}
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Категория"
            value={budgetForm.categoryId}
            onChange={(e) => setBudgetForm({ ...budgetForm, categoryId: e.target.value })}
          >
            <option value="">Выбери категорию</option>
            {(editingBudget ? categories : spare).map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
          <Field
            label="Лимит на период"
            inputMode="decimal"
            placeholder="400,00"
            value={budgetForm.limit}
            onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
          />
          <Select
            label="Период"
            value={budgetForm.period}
            onChange={(e) =>
              setBudgetForm({ ...budgetForm, period: e.target.value as 'month' })
            }
          >
            <option value="month">Месяц</option>
            <option value="week">Неделя</option>
          </Select>

          <label className="border-line bg-card-2 flex cursor-pointer items-center gap-3 rounded-md border p-3.5">
            <input
              type="checkbox"
              checked={budgetForm.rollover}
              onChange={(e) => setBudgetForm({ ...budgetForm, rollover: e.target.checked })}
              className="accent-accent h-5 w-5"
            />
            <span>
              <span className="block text-[13.5px] font-semibold">Переносить остаток</span>
              <span className="text-tx-2 text-[11.5px]">
                Конверт: неистраченное переходит дальше, перерасход — тоже
              </span>
            </span>
          </label>

          {budgetError && <p className="text-down text-[13px] font-semibold">{budgetError}</p>}

          <Button onClick={submitBudget}>{editingBudget ? 'Сохранить' : 'Создать конверт'}</Button>
          {editingBudget && (
            <Button
              variant="danger"
              onClick={async () => {
                await removeBudget.mutateAsync([editingBudget.id])
                setBudgetSheet(false)
              }}
            >
              Удалить конверт
            </Button>
          )}
        </div>
      </Sheet>

      <Sheet
        open={goalSheet}
        onClose={() => setGoalSheet(false)}
        title={editingGoal ? 'Цель' : 'Новая цель'}
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Название"
            placeholder="Отпуск"
            value={goalForm.name}
            onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Цель"
              inputMode="decimal"
              placeholder="3000"
              value={goalForm.target}
              onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
            />
            <Field
              label="Накоплено"
              inputMode="decimal"
              placeholder="0"
              value={goalForm.saved}
              onChange={(e) => setGoalForm({ ...goalForm, saved: e.target.value })}
            />
          </div>
          <Field
            label="Срок"
            type="date"
            value={goalForm.deadline}
            onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
          />
          <div>
            <p className="text-tx-2 mb-1.5 text-[11.5px] font-semibold tracking-wider uppercase">
              Иконка
            </p>
            <IconPicker value={goalForm.icon} onChange={(icon) => setGoalForm({ ...goalForm, icon })} />
          </div>
          <div>
            <p className="text-tx-2 mb-1.5 text-[11.5px] font-semibold tracking-wider uppercase">
              Цвет
            </p>
            <ColorPicker value={goalForm.color} onChange={(color) => setGoalForm({ ...goalForm, color })} />
          </div>

          {goalError && <p className="text-down text-[13px] font-semibold">{goalError}</p>}

          <Button onClick={submitGoal}>{editingGoal ? 'Сохранить' : 'Создать цель'}</Button>
          {editingGoal && (
            <Button
              variant="danger"
              onClick={async () => {
                await removeGoal.mutateAsync([editingGoal.id])
                setGoalSheet(false)
              }}
            >
              Удалить цель
            </Button>
          )}
        </div>
      </Sheet>
    </Screen>
  )
}
