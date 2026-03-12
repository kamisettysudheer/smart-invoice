import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import DynamicForm from '../components/DynamicForm'
import InvoicePreview from '../components/InvoicePreview'
import ExportButtons from '../components/ExportButtons'
import { generateExcel, downloadBlob } from '../utils/excelGenerator'
import { generatePdfFromElement } from '../utils/pdfGenerator'
import type { FormValues, ParsedTemplate } from '../types/template'

export default function FillPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const template = (location.state as { template?: ParsedTemplate })?.template
  const previewRef = useRef<HTMLDivElement>(null)

  const [values, setValues] = useState<FormValues>({})
  const [showPreview, setShowPreview] = useState(false)
  const [exporting, setExporting] = useState(false)

  const initialCounts = useMemo(() => {
    if (!template) return {}
    const counts: Record<string, number> = {}
    for (const g of template.lineItemGroups) {
      counts[g.prefix] = g.templateRowCount
    }
    return counts
  }, [template])

  const [lineItemCounts, setLineItemCounts] =
    useState<Record<string, number>>(initialCounts)

  const handleLineItemCountChange = useCallback(
    (prefix: string, count: number) => {
      setLineItemCounts((prev) => ({ ...prev, [prefix]: count }))
    },
    [],
  )

  const handleExportExcel = useCallback(async () => {
    if (!template) return
    setExporting(true)
    try {
      const blob = await generateExcel(template, values)
      downloadBlob(blob, `${template.name}_filled.xlsx`)
    } finally {
      setExporting(false)
    }
  }, [template, values])

  const handleExportPdf = useCallback(async () => {
    if (!template || !previewRef.current) return
    setExporting(true)
    try {
      await generatePdfFromElement(previewRef.current, `${template.name}_filled.pdf`)
    } finally {
      setExporting(false)
    }
  }, [template])

  if (!template) {
    return <Navigate to="/" replace />
  }

  const hasValues = Object.values(values).some((v) => v.trim() !== '')

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">{template.name}</h1>
          <p className="text-xs text-slate-400">
            {template.fields.length} fields &middot; {template.fileName}
          </p>
        </div>
        <button
          onClick={() => setShowPreview((p) => !p)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            showPreview
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </header>

      <div className="space-y-6">
        <DynamicForm
          standaloneFields={template.standaloneFields}
          lineItemGroups={template.lineItemGroups}
          values={values}
          onChange={setValues}
          lineItemCounts={lineItemCounts}
          onLineItemCountChange={handleLineItemCountChange}
        />

        {showPreview && (
          <InvoicePreview ref={previewRef} template={template} values={values} />
        )}

        {/* Hidden preview for PDF capture when preview is not shown */}
        {!showPreview && (
          <div style={{ position: 'fixed', left: '-9999px', top: 0, visibility: 'hidden', overflow: 'hidden', width: 800 }}>
            <InvoicePreview ref={previewRef} template={template} values={values} />
          </div>
        )}

        <div className="sticky bottom-4">
          <ExportButtons
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            disabled={!hasValues || exporting}
          />
          {exporting && (
            <p className="mt-2 text-center text-xs text-slate-400">Generating file...</p>
          )}
        </div>
      </div>
    </div>
  )
}
