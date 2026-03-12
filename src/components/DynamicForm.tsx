import { useCallback } from 'react'
import type {
  TemplateField,
  LineItemGroup,
  FormValues,
} from '../types/template'

interface Props {
  standaloneFields: TemplateField[]
  lineItemGroups: LineItemGroup[]
  values: FormValues
  onChange: (values: FormValues) => void
  lineItemCounts: Record<string, number>
  onLineItemCountChange: (prefix: string, count: number) => void
}

export default function DynamicForm({
  standaloneFields,
  lineItemGroups,
  values,
  onChange,
  lineItemCounts,
  onLineItemCountChange,
}: Props) {
  const setValue = useCallback(
    (key: string, val: string) => {
      onChange({ ...values, [key]: val })
    },
    [values, onChange],
  )

  return (
    <div className="space-y-6">
      {standaloneFields.length > 0 && (
        <fieldset className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-slate-600">
            Invoice Details
          </legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {standaloneFields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={values[f.key] ?? ''}
                onValueChange={(v) => setValue(f.key, v)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {lineItemGroups.map((group) => {
        const count = lineItemCounts[group.prefix] ?? group.templateRowCount
        return (
          <fieldset
            key={group.prefix}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <legend className="px-2 text-sm font-semibold text-slate-600">
              {humanize(group.prefix)} Items
            </legend>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 pr-2 text-left text-xs font-medium text-slate-400">
                      #
                    </th>
                    {group.columnLabels.map((label) => (
                      <th
                        key={label}
                        className="pb-2 pr-2 text-left text-xs font-medium text-slate-400"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: count }, (_, i) => {
                    const idx = i + 1
                    return (
                      <tr key={idx} className="border-b border-slate-50">
                        <td className="py-2 pr-2 text-xs text-slate-400">
                          {idx}
                        </td>
                        {group.columns.map((col) => {
                          const key = `${group.prefix}_${col}_${idx}`
                          return (
                            <td key={col} className="py-2 pr-2">
                              <input
                                type={inferInputType(col)}
                                inputMode={inferInputMode(col)}
                                value={values[key] ?? ''}
                                onChange={(e) => setValue(key, e.target.value)}
                                placeholder={humanize(col)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onLineItemCountChange(group.prefix, count + 1)
                }
                className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add Row
              </button>
              {count > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    onLineItemCountChange(group.prefix, count - 1)
                  }
                  className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-100"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12h-15"
                    />
                  </svg>
                  Remove Row
                </button>
              )}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}

function FieldInput({
  field,
  value,
  onValueChange,
}: {
  field: TemplateField
  value: string
  onValueChange: (v: string) => void
}) {
  const isTextarea = field.type === 'textarea'

  if (isTextarea) {
    return (
      <label className="col-span-full flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-600">
          {field.label}
        </span>
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={field.label}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y"
        />
      </label>
    )
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-600">{field.label}</span>
      <input
        type={field.type === 'phone' ? 'tel' : field.type}
        inputMode={
          field.type === 'number'
            ? 'decimal'
            : field.type === 'phone'
              ? 'tel'
              : field.type === 'email'
                ? 'email'
                : 'text'
        }
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={field.label}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </label>
  )
}

function humanize(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function inferInputType(col: string): string {
  const c = col.toLowerCase()
  if (c.includes('date')) return 'date'
  if (
    c.includes('qty') ||
    c.includes('quantity') ||
    c.includes('amount') ||
    c.includes('rate') ||
    c.includes('price') ||
    c.includes('total')
  )
    return 'number'
  return 'text'
}

function inferInputMode(col: string): React.HTMLAttributes<HTMLInputElement>['inputMode'] {
  const c = col.toLowerCase()
  if (
    c.includes('qty') ||
    c.includes('quantity') ||
    c.includes('amount') ||
    c.includes('rate') ||
    c.includes('price') ||
    c.includes('total')
  )
    return 'decimal'
  return 'text'
}
