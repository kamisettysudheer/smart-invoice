import type { SavedTemplate } from '../types/template'

interface Props {
  templates: SavedTemplate[]
  onSelect: (template: SavedTemplate) => void
  onDelete: (id: string) => void
}

export default function SavedTemplates({
  templates,
  onSelect,
  onDelete,
}: Props) {
  if (templates.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-700">
        Saved Templates
      </h2>
      <div className="space-y-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-slate-200 transition-shadow hover:shadow-md"
          >
            <button
              onClick={() => onSelect(t)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400">
                  {t.fieldCount} fields &middot;{' '}
                  {new Date(t.createdAt).toLocaleDateString()}
                </p>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(t.id)
              }}
              className="ml-2 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Delete template"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
