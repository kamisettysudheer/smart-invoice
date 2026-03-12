import { forwardRef, useMemo } from 'react'
import type { FormValues, ParsedTemplate, SheetLayout, RichCell, CellBorderSide } from '../types/template'

const MARKER_RE = /\{\{(\w+)\}\}/g

interface Props {
  template: ParsedTemplate
  values: FormValues
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function replaceMarkers(text: string, values: FormValues, placeholder: boolean): string {
  return text.replace(MARKER_RE, (_, key: string) => {
    const v = values[key]
    if (v !== undefined && v !== '') return v
    return placeholder ? `[${humanize(key)}]` : ''
  })
}

function borderCss(side: CellBorderSide | undefined): string {
  if (!side || !side.style) return 'none'
  const color = side.color || '#000000'
  const widthMap: Record<string, string> = {
    thin: '1px', medium: '2px', thick: '3px',
    dotted: '1px', dashed: '1px', hair: '0.5px',
    double: '3px', mediumDashed: '2px', mediumDashDot: '2px',
    mediumDashDotDot: '2px', slantDashDot: '2px',
    dashDot: '1px', dashDotDot: '1px',
  }
  const styleMap: Record<string, string> = {
    thin: 'solid', medium: 'solid', thick: 'solid',
    dotted: 'dotted', dashed: 'dashed', hair: 'solid',
    double: 'double', mediumDashed: 'dashed', mediumDashDot: 'dashed',
    mediumDashDotDot: 'dashed', slantDashDot: 'dashed',
    dashDot: 'dashed', dashDotDot: 'dashed',
  }
  return `${widthMap[side.style] || '1px'} ${styleMap[side.style] || 'solid'} ${color}`
}

const InvoicePreview = forwardRef<HTMLDivElement, Props>(
  function InvoicePreview({ template, values }, ref) {
    const layout = template.sheetLayout

    const tableData = useMemo(() => {
      if (!layout || layout.rowCount === 0) return null
      return buildTableData(layout, values)
    }, [layout, values])

    if (!tableData || tableData.rows.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
          Preview will appear as you fill the form
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Preview
        </h3>
        <div
          ref={ref}
          style={{
            background: '#fff',
            position: 'relative',
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '10mm',
            boxSizing: 'border-box',
            overflow: 'hidden',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          }}
        >
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              tableLayout: 'fixed',
              position: 'relative',
              zIndex: 1,
              background: 'transparent',
            }}
          >
            <colgroup>
              {tableData.colIndices.map((ci) => (
                <col key={ci} style={{ width: layout.colWidths[ci] || 64 }} />
              ))}
            </colgroup>
            <tbody>
              {tableData.rows.map((row) => (
                <tr key={row.rowIndex} style={{ height: layout.rowHeights[row.rowIndex] || 20 }}>
                  {row.cells.map((td) => {
                    if (!td) return null
                    const cell = td.cell
                    const style = cellToInlineStyle(cell)
                    const displayText = replaceMarkers(cell.value, values, true)
                    const isPlaceholder = displayText.startsWith('[') && displayText.endsWith(']') &&
                      MARKER_RE.test(cell.value)

                    return (
                      <td
                        key={td.colIndex}
                        colSpan={cell.colSpan || 1}
                        rowSpan={cell.rowSpan || 1}
                        style={style}
                      >
                        <span style={isPlaceholder ? { color: '#94a3b8', fontStyle: 'italic' } : undefined}>
                          {displayText}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {layout.images.length > 0 && layout.images.map((img, i) => (
            <img
              key={i}
              src={`data:${img.mediaType};base64,${img.base64}`}
              alt=""
              style={{
                position: 'absolute',
                left: computeImageLeft(layout, img.col),
                top: computeImageTop(layout, img.row),
                width: img.width,
                height: img.height,
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      </div>
    )
  },
)

export default InvoicePreview

interface TableRow {
  rowIndex: number
  cells: (TableCell | null)[]
}

interface TableCell {
  colIndex: number
  cell: RichCell
}

interface TableData {
  rows: TableRow[]
  colIndices: number[]
}

function buildTableData(layout: SheetLayout, _values: FormValues): TableData {
  const colIndices: number[] = []
  for (let c = 1; c <= layout.colCount; c++) colIndices.push(c)

  const coveredCells = new Set<string>()

  const rows: TableRow[] = []
  for (let r = 1; r <= layout.rowCount; r++) {
    const rowCells: (TableCell | null)[] = []

    for (const c of colIndices) {
      const key = `${r},${c}`
      if (coveredCells.has(key)) continue

      const cell = layout.cells[key]
      if (!cell) {
        rowCells.push({ colIndex: c, cell: { value: '', style: {} } })
        continue
      }

      if (cell.isMerged) continue

      if (cell.isMergeStart && cell.rowSpan && cell.colSpan) {
        for (let mr = r; mr < r + cell.rowSpan; mr++) {
          for (let mc = c; mc < c + cell.colSpan; mc++) {
            if (mr === r && mc === c) continue
            coveredCells.add(`${mr},${mc}`)
          }
        }
      }

      rowCells.push({ colIndex: c, cell })
    }

    rows.push({ rowIndex: r, cells: rowCells })
  }

  return { rows, colIndices }
}

function cellToInlineStyle(cell: RichCell): React.CSSProperties {
  const s: React.CSSProperties = {
    padding: '2px 4px',
    verticalAlign: 'middle',
    overflow: 'hidden',
    fontSize: 11,
    color: '#000000',
  }

  const { font, fill, border, alignment } = cell.style

  if (fill) s.backgroundColor = fill
  if (font) {
    if (font.bold) s.fontWeight = 'bold'
    if (font.italic) s.fontStyle = 'italic'
    if (font.underline) s.textDecoration = 'underline'
    if (font.size) s.fontSize = font.size * 1.1
    if (font.color) s.color = font.color
    if (font.name) s.fontFamily = font.name
  }
  if (border) {
    if (border.top) s.borderTop = borderCss(border.top)
    if (border.bottom) s.borderBottom = borderCss(border.bottom)
    if (border.left) s.borderLeft = borderCss(border.left)
    if (border.right) s.borderRight = borderCss(border.right)
  }
  if (alignment) {
    if (alignment.horizontal) s.textAlign = alignment.horizontal as React.CSSProperties['textAlign']
    if (alignment.vertical) {
      const vMap: Record<string, string> = { top: 'top', middle: 'middle', bottom: 'bottom' }
      s.verticalAlign = (vMap[alignment.vertical] || 'middle') as React.CSSProperties['verticalAlign']
    }
    if (alignment.wrapText) s.whiteSpace = 'pre-wrap'
  }

  return s
}

function computeImageLeft(layout: SheetLayout, col: number): number {
  let px = 0
  for (let c = 1; c < col; c++) px += layout.colWidths[c] || 64
  return px
}

function computeImageTop(layout: SheetLayout, row: number): number {
  let px = 0
  for (let r = 1; r < row; r++) px += layout.rowHeights[r] || 20
  return px
}
