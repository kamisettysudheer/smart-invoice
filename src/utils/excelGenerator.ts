import ExcelJS from 'exceljs'
import type { FormValues, ParsedTemplate } from '../types/template'
import { base64ToArrayBuffer } from './excelParser'

const MARKER_RE = /\{\{(\w+)\}\}/g

export async function generateExcel(
  template: ParsedTemplate,
  values: FormValues,
): Promise<Blob> {
  const data = base64ToArrayBuffer(template.fileBase64)
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(data)

  wb.eachSheet((ws) => {
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        const text = getCellText(cell)
        if (!MARKER_RE.test(text)) return
        MARKER_RE.lastIndex = 0

        const replaced = text.replace(MARKER_RE, (_, key: string) => values[key] ?? '')

        const isNumeric = replaced !== '' && !isNaN(Number(replaced)) &&
          text.match(MARKER_RE)?.length === 1 && text === `{{${text.match(/\{\{(\w+)\}\}/)?.[1]}}}`

        if (isNumeric) {
          cell.value = Number(replaced)
        } else {
          cell.value = replaced
        }
      })
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function getCellText(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v === null || v === undefined) return ''
  if (typeof v === 'object' && 'richText' in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join('')
  }
  if (typeof v === 'object' && 'result' in v) {
    const formula = v as ExcelJS.CellFormulaValue
    if (formula.result !== undefined) return String(formula.result)
    return ''
  }
  if (v instanceof Date) return v.toLocaleDateString()
  return String(v)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
