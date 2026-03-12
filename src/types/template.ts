export type FieldType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'textarea'

export interface TemplateField {
  key: string
  label: string
  type: FieldType
  sheet: string
  cell: string
  /** 1-based row index */
  row: number
  /** 1-based column index */
  col: number
  group?: string
  groupIndex?: number
  groupField?: string
}

export interface LineItemGroup {
  prefix: string
  columns: string[]
  columnLabels: string[]
  templateRowCount: number
}

// ---- Rich formatting types for preview fidelity ----

export interface CellFont {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  size?: number
  color?: string
  name?: string
}

export interface CellBorderSide {
  style?: string
  color?: string
}

export interface CellBorder {
  top?: CellBorderSide
  bottom?: CellBorderSide
  left?: CellBorderSide
  right?: CellBorderSide
}

export interface CellAlignment {
  horizontal?: string
  vertical?: string
  wrapText?: boolean
}

export interface CellStyle {
  font?: CellFont
  fill?: string
  border?: CellBorder
  alignment?: CellAlignment
  numFmt?: string
}

export interface RichCell {
  value: string
  style: CellStyle
  /** True if this cell is the top-left of a merge range */
  isMergeStart?: boolean
  colSpan?: number
  rowSpan?: number
  /** True if this cell is covered by another cell's merge range */
  isMerged?: boolean
}

export interface EmbeddedImage {
  base64: string
  mediaType: string
  /** 1-based column of top-left anchor */
  col: number
  /** 1-based row of top-left anchor */
  row: number
  width: number
  height: number
}

export interface SheetLayout {
  /** Column widths in pixels, indexed by 1-based column number */
  colWidths: Record<number, number>
  /** Row heights in pixels, indexed by 1-based row number */
  rowHeights: Record<number, number>
  /** 2D grid of cells; key = "row,col" (1-based) */
  cells: Record<string, RichCell>
  /** Total rows in the sheet */
  rowCount: number
  /** Total columns in the sheet */
  colCount: number
  images: EmbeddedImage[]
}

export interface ParsedTemplate {
  name: string
  fields: TemplateField[]
  standaloneFields: TemplateField[]
  lineItemGroups: LineItemGroup[]
  fileBase64: string
  fileName: string
  createdAt: number
  /** Rich layout data for the first sheet, used by the preview */
  sheetLayout: SheetLayout
}

export type FormValues = Record<string, string>

export interface SavedTemplate {
  id: string
  name: string
  fileName: string
  fieldCount: number
  createdAt: number
  fileBase64: string
}
