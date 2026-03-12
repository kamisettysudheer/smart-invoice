import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TemplateUpload from '../components/TemplateUpload'
import SavedTemplates from '../components/SavedTemplates'
import { parseTemplate, base64ToArrayBuffer } from '../utils/excelParser'
import {
  getSavedTemplates,
  saveTemplate,
  deleteTemplate,
} from '../utils/storage'
import type { SavedTemplate, ParsedTemplate } from '../types/template'

export default function HomePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedTemplate[]>(getSavedTemplates)

  const processFile = useCallback(
    async (data: ArrayBuffer, fileName: string) => {
      setLoading(true)
      setError(null)
      try {
        const parsed = await parseTemplate(data, fileName)
        if (parsed.fields.length === 0) {
          setError(
            'No {{markers}} found in the template. Add markers like {{customer_name}} to cells you want to fill.',
          )
          setLoading(false)
          return
        }
        saveTemplate(parsed)
        setSaved(getSavedTemplates())
        navigateToFill(parsed)
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Failed to parse the Excel file.',
        )
        setLoading(false)
      }
    },
    [],
  )

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result as ArrayBuffer
        processFile(data, file.name)
      }
      reader.readAsArrayBuffer(file)
    },
    [processFile],
  )

  const handleSelectSaved = useCallback(async (t: SavedTemplate) => {
    setLoading(true)
    setError(null)
    try {
      const data = base64ToArrayBuffer(t.fileBase64)
      const parsed = await parseTemplate(data, t.fileName)
      navigateToFill(parsed)
    } catch {
      setError('Failed to load saved template.')
      setLoading(false)
    }
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteTemplate(id)
    setSaved(getSavedTemplates())
  }, [])

  function navigateToFill(parsed: ParsedTemplate) {
    navigate('/fill', { state: { template: parsed } })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Invoice Form Builder
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Upload an Excel template with{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-blue-600">
            {'{{markers}}'}
          </code>{' '}
          and fill it out with a simple form.
        </p>
      </header>

      <TemplateUpload onFile={handleFile} loading={loading} />

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <SavedTemplates
        templates={saved}
        onSelect={handleSelectSaved}
        onDelete={handleDelete}
      />

      <div className="mt-10 rounded-xl bg-slate-100 p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-600">
          How it works
        </h3>
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-slate-500">
          <li>
            Create an Excel template with{' '}
            <code className="rounded bg-white px-1 py-0.5 text-xs font-mono text-blue-600">
              {'{{field_name}}'}
            </code>{' '}
            placeholders in cells
          </li>
          <li>Upload the template here</li>
          <li>Fill in the form that appears</li>
          <li>Download your invoice as Excel or PDF</li>
        </ol>
        <div className="mt-3 text-xs text-slate-400">
          Example markers:{' '}
          <code className="text-blue-500">{'{{customer_name}}'}</code>,{' '}
          <code className="text-blue-500">{'{{invoice_date}}'}</code>,{' '}
          <code className="text-blue-500">{'{{item_desc_1}}'}</code>
        </div>
        <a
          href="/sample_invoice_template.xlsx"
          download
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm border border-slate-200 transition-colors hover:bg-blue-50"
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
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Download Sample Template
        </a>
      </div>
    </div>
  )
}
