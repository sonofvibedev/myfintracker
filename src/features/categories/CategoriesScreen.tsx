import { useState } from 'react'
import { Screen } from '@/shared/ui/Screen'
import { Button, ColorPicker, Field, IconPicker, Select, Sheet } from '@/shared/ui/kit'
import { useCategories, useDeleteCategory, useSaveCategory } from '@/shared/lib/queries'
import type { Category, CategoryKind } from '@/shared/lib/types'

const blank = { name: '', icon: '📦', color: '#5b5bd6', parentId: '' }

export function CategoriesScreen() {
  const [kind, setKind] = useState<CategoryKind>('expense')
  const { data: categories = [] } = useCategories(kind)
  const save = useSaveCategory()
  const remove = useDeleteCategory()

  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [reassignTo, setReassignTo] = useState('')

  const roots = categories.filter((c) => !c.parentId)
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id)

  const openNew = () => {
    setEditing(null)
    setForm(blank)
    setError('')
    setOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({ name: c.name, icon: c.icon, color: c.color, parentId: c.parentId ?? '' })
    setError('')
    setReassignTo('')
    setOpen(true)
  }

  const submit = async () => {
    const name = form.name.trim()
    if (!name) return setError('Введи название')

    await save.mutateAsync([
      {
        ...editing,
        name,
        kind,
        icon: form.icon,
        color: form.color,
        parentId: form.parentId || null,
      },
    ])
    setOpen(false)
  }

  const onDelete = async () => {
    if (!editing) return
    try {
      await remove.mutateAsync([editing.id, reassignTo || undefined])
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить')
    }
  }

  return (
    <Screen title="Категории" kicker="Куда уходят деньги">
      <div className="bg-card-2 mb-4 grid grid-cols-2 gap-1.5 rounded-md p-1">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`cursor-pointer rounded-sm px-2 py-2.5 text-[12.5px] font-bold transition-all duration-[var(--dur)] [transition-timing-function:var(--ease)] ${
              kind === k ? 'bg-card text-tx shadow-[var(--sh-2)]' : 'text-tx-2'
            }`}
          >
            {k === 'expense' ? 'Расходы' : 'Доходы'}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {roots.map((c) => (
          <li key={c.id}>
            <CategoryRow category={c} onClick={() => openEdit(c)} />
            {childrenOf(c.id).length > 0 && (
              <ul className="mt-2 ml-7 flex flex-col gap-2">
                {childrenOf(c.id).map((child) => (
                  <li key={child.id}>
                    <CategoryRow category={child} onClick={() => openEdit(child)} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Button onClick={openNew}>Новая категория</Button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? 'Категория' : 'Новая категория'}>
        <div className="flex flex-col gap-4">
          <Field
            label="Название"
            value={form.name}
            autoFocus
            placeholder="Продукты"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Входит в"
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          >
            <option value="">Самостоятельная</option>
            {roots
              .filter((r) => r.id !== editing?.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.icon} {r.name}
                </option>
              ))}
          </Select>
          <div>
            <p className="text-tx-2 mb-1.5 text-[11.5px] font-semibold tracking-wider uppercase">
              Иконка
            </p>
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
          </div>
          <div>
            <p className="text-tx-2 mb-1.5 text-[11.5px] font-semibold tracking-wider uppercase">
              Цвет
            </p>
            <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
          </div>

          {error && <p className="text-down text-[13px] font-semibold">{error}</p>}

          {editing && error.includes('операциях') && (
            <Select
              label="Перенести операции в"
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
            >
              <option value="">Выбери категорию</option>
              {categories
                .filter((c) => c.id !== editing.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
            </Select>
          )}

          <Button onClick={submit} disabled={save.isPending}>
            {editing ? 'Сохранить' : 'Создать категорию'}
          </Button>

          {editing && (
            <Button variant="danger" onClick={onDelete}>
              Удалить
            </Button>
          )}
        </div>
      </Sheet>
    </Screen>
  )
}

function CategoryRow({ category, onClick }: { category: Category; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-line bg-card flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left shadow-[var(--sh-2)] transition-transform duration-[var(--dur)] [transition-timing-function:var(--ease)] active:scale-[0.985]"
    >
      <span
        className="grid h-9 w-9 flex-none place-items-center rounded-md text-base"
        style={{ background: `color-mix(in srgb, ${category.color} 16%, transparent)` }}
      >
        {category.icon}
      </span>
      <span className="flex-1 truncate text-[14px] font-semibold">{category.name}</span>
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: category.color }} />
    </button>
  )
}
