import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import type {
  TemplateField,
  FieldType,
  LineItemGroup,
  ParsedTemplate,
  SheetLayout,
  RichCell,
  CellStyle,
  CellFont,
  CellBorder,
  CellBorderSide,
  CellAlignment,
  EmbeddedImage,
} from '../types/template'

const MARKER_RE = /\{\{(\w+)\}\}/g
const GROUP_RE = /^(.+?)_(.+?)_(\d+)$/

function inferType(key: string): FieldType {
  const k = key.toLowerCase()
  if (k.includes('date') || k.includes('due')) return 'date'
  if (
    k.includes('amount') || k.includes('total') || k.includes('subtotal') ||
    k.includes('tax') || k.includes('qty') || k.includes('quantity') ||
    k.includes('rate') || k.includes('price') || k.includes('discount')
  ) return 'number'
  if (k.includes('email')) return 'email'
  if (k.includes('phone') || k.includes('mobile') || k.includes('tel')) return 'phone'
  if (
    k.includes('address') || k.includes('notes') || k.includes('description') ||
    k.includes('desc') || k.includes('remark')
  ) return 'textarea'
  return 'text'
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function resolveColor(color: Partial<ExcelJS.Color> | undefined): string | undefined {
  if (!color) return undefined
  if (color.argb) {
    const argb = color.argb
    if (argb.length === 8) return '#' + argb.substring(2)
    return '#' + argb
  }
  if (color.theme !== undefined) {
    // OOXML theme indices: 0=dk1, 1=lt1, 2=dk2, 3=lt2, 4-9=accent1-6
    const themeColors: Record<number, string> = {
      0: '#000000', 1: '#FFFFFF', 2: '#44546A', 3: '#E7E6E6',
      4: '#4472C4', 5: '#ED7D31', 6: '#A5A5A5', 7: '#FFC000',
      8: '#5B9BD5', 9: '#70AD47',
    }
    const base = themeColors[color.theme]
    if (!base) return undefined
    const tint = (color as Record<string, unknown>).tint as number | undefined
    if (tint != null && tint !== 0) {
      return applyTint(base, tint)
    }
    return base
  }
  return undefined
}

function applyTint(hex: string, tint: number): string {
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)
  if (tint > 0) {
    r = Math.round(r + (255 - r) * tint)
    g = Math.round(g + (255 - g) * tint)
    b = Math.round(b + (255 - b) * tint)
  } else {
    r = Math.round(r * (1 + tint))
    g = Math.round(g * (1 + tint))
    b = Math.round(b * (1 + tint))
  }
  const clamp = (v: number) => Math.max(0, Math.min(255, v))
  return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('')
}

function extractFont(font: Partial<ExcelJS.Font> | undefined): CellFont | undefined {
  if (!font) return undefined
  const f: CellFont = {}
  if (font.bold) f.bold = true
  if (font.italic) f.italic = true
  if (font.underline) f.underline = true
  if (font.size) f.size = font.size
  if (font.color) f.color = resolveColor(font.color)
  if (font.name) f.name = font.name
  return Object.keys(f).length > 0 ? f : undefined
}

function extractBorderSide(
  side: Partial<ExcelJS.Border> | undefined,
): CellBorderSide | undefined {
  if (!side || !side.style) return undefined
  return {
    style: side.style,
    color: resolveColor(side.color),
  }
}

function extractBorder(border: Partial<ExcelJS.Borders> | undefined): CellBorder | undefined {
  if (!border) return undefined
  const b: CellBorder = {}
  const top = extractBorderSide(border.top)
  const bottom = extractBorderSide(border.bottom)
  const left = extractBorderSide(border.left)
  const right = extractBorderSide(border.right)
  if (top) b.top = top
  if (bottom) b.bottom = bottom
  if (left) b.left = left
  if (right) b.right = right
  return Object.keys(b).length > 0 ? b : undefined
}

function extractFill(fill: ExcelJS.Fill | undefined): string | undefined {
  if (!fill) return undefined
  if (fill.type === 'pattern' && fill.pattern !== 'none') {
    const patternFill = fill as ExcelJS.FillPattern
    return resolveColor(patternFill.fgColor as Partial<ExcelJS.Color> | undefined)
  }
  return undefined
}

function extractAlignment(
  alignment: Partial<ExcelJS.Alignment> | undefined,
): CellAlignment | undefined {
  if (!alignment) return undefined
  const a: CellAlignment = {}
  if (alignment.horizontal) a.horizontal = alignment.horizontal
  if (alignment.vertical) a.vertical = alignment.vertical
  if (alignment.wrapText) a.wrapText = true
  return Object.keys(a).length > 0 ? a : undefined
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
  if (v instanceof Date) {
    return v.toLocaleDateString()
  }
  return String(v)
}

export async function parseTemplate(
  data: ArrayBuffer,
  fileName: string,
): Promise<ParsedTemplate> {
  // Keep a safe copy of the raw bytes before ExcelJS potentially neuters the buffer
  const rawCopy = data.slice(0)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(data)

  const fields: TemplateField[] = []
  let sheetLayout: SheetLayout = {
    colWidths: {}, rowHeights: {}, cells: {},
    rowCount: 0, colCount: 0, images: [],
  }

  let firstWs: ExcelJS.Worksheet | undefined

  wb.eachSheet((ws) => {
    const sheetName = ws.name

    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const text = getCellText(cell)
        MARKER_RE.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = MARKER_RE.exec(text)) !== null) {
          const key = match[1]
          const groupMatch = GROUP_RE.exec(key)
          const field: TemplateField = {
            key, label: humanize(key), type: inferType(key),
            sheet: sheetName, cell: cell.address,
            row: rowNumber, col: colNumber,
          }
          if (groupMatch) {
            field.group = groupMatch[1]
            field.groupField = groupMatch[2]
            field.groupIndex = parseInt(groupMatch[3], 10)
          }
          fields.push(field)
        }
      })
    })

    if (!firstWs) firstWs = ws
  })

  if (firstWs) {
    sheetLayout = await extractSheetLayout(firstWs, wb, rawCopy)
  }

  fields.sort((a, b) => a.row - b.row || a.col - b.col)

  // Deduplicate standalone fields by key — the same marker can appear in
  // multiple cells/sheets but the user should only fill it once.
  const seenKeys = new Set<string>()
  const standaloneFields = fields.filter((f) => {
    if (f.group) return false
    if (seenKeys.has(f.key)) return false
    seenKeys.add(f.key)
    return true
  })

  const lineItemGroups = buildLineItemGroups(fields)
  const fileBase64 = arrayBufferToBase64(data)

  return {
    name: fileName.replace(/\.\w+$/, ''),
    fields, standaloneFields, lineItemGroups,
    fileBase64, fileName,
    createdAt: Date.now(),
    sheetLayout,
  }
}

async function extractSheetLayout(ws: ExcelJS.Worksheet, wb: ExcelJS.Workbook, rawData: ArrayBuffer): Promise<SheetLayout> {
  const cells: Record<string, RichCell> = {}
  const colWidths: Record<number, number> = {}
  const rowHeights: Record<number, number> = {}
  let maxRow = 0
  let maxCol = 0

  for (let ci = 1; ci <= (ws.columnCount || 1); ci++) {
    const col = ws.getColumn(ci)
    colWidths[ci] = col.width ? Math.round(col.width * 7.5) : 64
  }

  const mergeMap = new Map<string, { startRow: number; startCol: number; endRow: number; endCol: number }>()

  if (ws.model.merges) {
    for (const mergeRef of ws.model.merges) {
      const parts = mergeRef.split(':')
      if (parts.length !== 2) continue
      const tl = parseCellRef(parts[0])
      const br = parseCellRef(parts[1])
      if (!tl || !br) continue

      for (let r = tl.row; r <= br.row; r++) {
        for (let c = tl.col; c <= br.col; c++) {
          mergeMap.set(`${r},${c}`, { startRow: tl.row, startCol: tl.col, endRow: br.row, endCol: br.col })
        }
      }
    }
  }

  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber > maxRow) maxRow = rowNumber
    rowHeights[rowNumber] = row.height ? Math.round(row.height * 1.33) : 20

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > maxCol) maxCol = colNumber

      const mergeInfo = mergeMap.get(`${rowNumber},${colNumber}`)
      const isMergeStart = mergeInfo
        ? mergeInfo.startRow === rowNumber && mergeInfo.startCol === colNumber
        : false
      const isMerged = mergeInfo
        ? !(mergeInfo.startRow === rowNumber && mergeInfo.startCol === colNumber)
        : false

      const style: CellStyle = {}
      style.font = extractFont(cell.font)
      style.fill = extractFill(cell.fill)
      style.border = extractBorder(cell.border)
      style.alignment = extractAlignment(cell.alignment)
      if (cell.numFmt && cell.numFmt !== 'General') style.numFmt = cell.numFmt

      const richCell: RichCell = {
        value: getCellText(cell),
        style,
      }

      if (isMergeStart && mergeInfo) {
        richCell.isMergeStart = true
        richCell.colSpan = mergeInfo.endCol - mergeInfo.startCol + 1
        richCell.rowSpan = mergeInfo.endRow - mergeInfo.startRow + 1
      }
      if (isMerged) {
        richCell.isMerged = true
      }

      cells[`${rowNumber},${colNumber}`] = richCell
    })
  })

  const images: EmbeddedImage[] = []

  // --- Tier 1: ExcelJS public API ---
  try {
    const wsImages = ws.getImages()
    console.log('[Image Tier 1] ws.getImages() count:', wsImages.length)
    for (const img of wsImages) {
      const wbImg = wb.getImage(Number(img.imageId))
      if (!wbImg) {
        console.log('[Image Tier 1] wb.getImage returned null for id:', img.imageId)
        continue
      }

      let base64: string | undefined
      if (wbImg.base64) {
        base64 = wbImg.base64
      } else if (wbImg.buffer) {
        base64 = bufferLikeToBase64(wbImg.buffer)
      }
      if (!base64) {
        console.log('[Image Tier 1] No base64/buffer data for image id:', img.imageId)
        continue
      }

      const mediaType = wbImg.extension === 'png' ? 'image/png'
        : wbImg.extension === 'gif' ? 'image/gif'
        : 'image/jpeg'

      let col = 1, row = 1, width = 100, height = 100
      if (img.range && typeof img.range === 'object') {
        const range = img.range as {
          tl?: { col?: number; row?: number; nativeCol?: number; nativeRow?: number }
          br?: { col?: number; row?: number; nativeCol?: number; nativeRow?: number }
          ext?: { width?: number; height?: number }
        }
        if (range.tl) {
          col = Math.floor((range.tl.nativeCol ?? range.tl.col ?? 0)) + 1
          row = Math.floor((range.tl.nativeRow ?? range.tl.row ?? 0)) + 1
        }
        if (range.ext) {
          width = Math.round((range.ext.width ?? 100) / 9525)
          height = Math.round((range.ext.height ?? 100) / 9525)
        } else if (range.br && range.tl) {
          const brCol = Math.floor((range.br.nativeCol ?? range.br.col ?? 0)) + 1
          const brRow = Math.floor((range.br.nativeRow ?? range.br.row ?? 0)) + 1
          let w = 0
          for (let c = col; c < brCol; c++) w += (colWidths[c] || 64)
          let h = 0
          for (let r = row; r < brRow; r++) h += (rowHeights[r] || 20)
          width = w || 100
          height = h || 100
        }
      }

      images.push({ base64, mediaType, col, row, width, height })
    }
  } catch (err) {
    console.warn('[Image Tier 1] ExcelJS API extraction failed:', err)
  }
  console.log('[Image Tier 1] Result:', images.length, 'images extracted')

  // --- Tier 2: Direct wb.media access ---
  if (images.length === 0) {
    try {
      const wbMedia = (wb as unknown as Record<string, unknown>).media as Array<{
        type?: string; extension?: string;
        buffer?: Uint8Array; base64?: string; name?: string
      }> | undefined
      console.log('[Image Tier 2] wb.media exists:', !!wbMedia, 'count:', wbMedia?.length ?? 0)
      if (wbMedia && wbMedia.length > 0) {
        const imageMedia = wbMedia.filter(m => m.type === 'image')
        console.log('[Image Tier 2] image-type media:', imageMedia.length)
        const wsImages = ws.getImages()
        for (let i = 0; i < imageMedia.length; i++) {
          const m = imageMedia[i]
          let base64: string | undefined
          if (m.base64) base64 = m.base64
          else if (m.buffer) base64 = bufferLikeToBase64(m.buffer)
          if (!base64) continue

          const mediaType = m.extension === 'png' ? 'image/png'
            : m.extension === 'gif' ? 'image/gif' : 'image/jpeg'

          let col = 1, row = 1, width = 150, height = 150
          if (i < wsImages.length && wsImages[i].range && typeof wsImages[i].range === 'object') {
            const range = wsImages[i].range as {
              tl?: { col?: number; row?: number; nativeCol?: number; nativeRow?: number }
              br?: { col?: number; row?: number; nativeCol?: number; nativeRow?: number }
              ext?: { width?: number; height?: number }
            }
            if (range.tl) {
              col = Math.floor((range.tl.nativeCol ?? range.tl.col ?? 0)) + 1
              row = Math.floor((range.tl.nativeRow ?? range.tl.row ?? 0)) + 1
            }
            if (range.ext) {
              width = Math.round((range.ext.width ?? 150) / 9525)
              height = Math.round((range.ext.height ?? 150) / 9525)
            } else if (range.br && range.tl) {
              const brCol = Math.floor((range.br.nativeCol ?? range.br.col ?? 0)) + 1
              const brRow = Math.floor((range.br.nativeRow ?? range.br.row ?? 0)) + 1
              let w = 0
              for (let c = col; c < brCol; c++) w += (colWidths[c] || 64)
              let h = 0
              for (let r = row; r < brRow; r++) h += (rowHeights[r] || 20)
              width = w || 150
              height = h || 150
            }
          }

          images.push({ base64, mediaType, col, row, width, height })
        }
      }
    } catch (err) {
      console.warn('[Image Tier 2] Direct media fallback failed:', err)
    }
    console.log('[Image Tier 2] Result:', images.length, 'images extracted')
  }

  // --- Tier 3: JSZip raw extraction ---
  if (images.length === 0) {
    try {
      const zipImages = await extractImagesFromZip(rawData, colWidths, rowHeights)
      console.log('[Image Tier 3] ZIP fallback extracted:', zipImages.length, 'images')
      images.push(...zipImages)
    } catch (err) {
      console.warn('[Image Tier 3] ZIP image fallback failed:', err)
    }
  }

  return { colWidths, rowHeights, cells, rowCount: maxRow, colCount: maxCol, images }
}

function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/)
  if (!match) return null
  let col = 0
  for (const ch of match[1]) {
    col = col * 26 + (ch.charCodeAt(0) - 64)
  }
  return { row: parseInt(match[2], 10), col }
}

function buildLineItemGroups(fields: TemplateField[]): LineItemGroup[] {
  const map = new Map<string, { columns: Set<string>; maxIndex: number }>()
  for (const f of fields) {
    if (!f.group || !f.groupField) continue
    let entry = map.get(f.group)
    if (!entry) {
      entry = { columns: new Set(), maxIndex: 0 }
      map.set(f.group, entry)
    }
    entry.columns.add(f.groupField)
    entry.maxIndex = Math.max(entry.maxIndex, f.groupIndex ?? 0)
  }
  const groups: LineItemGroup[] = []
  for (const [prefix, { columns, maxIndex }] of map) {
    const cols = Array.from(columns)
    groups.push({
      prefix, columns: cols,
      columnLabels: cols.map(humanize),
      templateRowCount: maxIndex,
    })
  }
  return groups
}

const XDR_NS = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

function getElementsByTagNS(parent: Element | Document, ns: string, localName: string): Element[] {
  let els = parent.getElementsByTagNameNS(ns, localName)
  if (els.length === 0) {
    els = parent.getElementsByTagNameNS('*', localName)
  }
  if (els.length === 0) {
    els = parent.getElementsByTagName(localName)
  }
  return Array.from(els)
}

function getAttributeNS(el: Element, ns: string, localName: string): string | null {
  return el.getAttributeNS(ns, localName) || el.getAttribute(`r:${localName}`) || el.getAttribute(localName)
}

async function extractImagesFromZip(
  rawData: ArrayBuffer,
  colWidths: Record<number, number>,
  rowHeights: Record<number, number>,
): Promise<EmbeddedImage[]> {
  const zip = await JSZip.loadAsync(rawData)

  const mediaFiles = new Map<string, { base64: string; mediaType: string }>()
  for (const [path, file] of Object.entries(zip.files)) {
    if (!path.startsWith('xl/media/') || file.dir) continue
    const base64 = await file.async('base64')
    const ext = path.split('.').pop()?.toLowerCase() || ''
    const mediaType = ext === 'png' ? 'image/png'
      : ext === 'gif' ? 'image/gif'
      : 'image/jpeg'
    mediaFiles.set(path.replace('xl/media/', ''), { base64, mediaType })
  }
  console.log('[Image Tier 3] ZIP media files found:', mediaFiles.size, [...mediaFiles.keys()])
  if (mediaFiles.size === 0) return []

  const images: EmbeddedImage[] = []
  const domParser = new DOMParser()

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue
    if (!path.match(/^xl\/drawings\/[^/]+\.xml$/)) continue

    const drawingName = path.replace('xl/drawings/', '')
    const relsPath = `xl/drawings/_rels/${drawingName}.rels`
    const rIdToFile = new Map<string, string>()

    const relsEntry = zip.files[relsPath]
    if (relsEntry) {
      const relsXml = await relsEntry.async('string')
      const relsDoc = domParser.parseFromString(relsXml, 'application/xml')
      const rels = relsDoc.getElementsByTagName('Relationship')
      for (let i = 0; i < rels.length; i++) {
        const id = rels[i].getAttribute('Id')
        const target = rels[i].getAttribute('Target')
        if (id && target) {
          const m = target.match(/media\/(.+)$/)
          if (m) rIdToFile.set(id, m[1])
        }
      }
    }
    console.log('[Image Tier 3] Drawing:', drawingName, 'rId mappings:', rIdToFile.size)

    const xml = await file.async('string')
    const doc = domParser.parseFromString(xml, 'application/xml')

    const twoCellAnchors = getElementsByTagNS(doc, XDR_NS, 'twoCellAnchor')
    console.log('[Image Tier 3] twoCellAnchors found:', twoCellAnchors.length)
    for (const anchor of twoCellAnchors) {
      const img = parseDrawingAnchor(anchor, 'twoCell', rIdToFile, mediaFiles, colWidths, rowHeights)
      if (img) images.push(img)
    }

    const oneCellAnchors = getElementsByTagNS(doc, XDR_NS, 'oneCellAnchor')
    console.log('[Image Tier 3] oneCellAnchors found:', oneCellAnchors.length)
    for (const anchor of oneCellAnchors) {
      const img = parseDrawingAnchor(anchor, 'oneCell', rIdToFile, mediaFiles, colWidths, rowHeights)
      if (img) images.push(img)
    }
  }

  if (images.length === 0 && mediaFiles.size > 0) {
    console.log('[Image Tier 3] No positioned images found, using all media files as fallback')
    for (const [, { base64, mediaType }] of mediaFiles) {
      images.push({ base64, mediaType, col: 1, row: 1, width: 150, height: 150 })
    }
  }

  return images
}

function parseDrawingAnchor(
  anchor: Element,
  type: 'twoCell' | 'oneCell',
  rIdToFile: Map<string, string>,
  mediaFiles: Map<string, { base64: string; mediaType: string }>,
  colWidths: Record<number, number>,
  rowHeights: Record<number, number>,
): EmbeddedImage | null {
  const blips = getElementsByTagNS(anchor, A_NS, 'blip')
  if (blips.length === 0) return null
  const rId = getAttributeNS(blips[0], R_NS, 'embed')
  if (!rId) return null

  const filename = rIdToFile.get(rId)
  if (!filename) {
    console.log('[Image Tier 3] rId not found in rels map:', rId, 'available:', [...rIdToFile.keys()])
    return null
  }
  const media = mediaFiles.get(filename)
  if (!media) return null

  const fromEls = getElementsByTagNS(anchor, XDR_NS, 'from')
  if (fromEls.length === 0) return null
  const col = xmlChildInt(fromEls[0], XDR_NS, 'col') + 1
  const row = xmlChildInt(fromEls[0], XDR_NS, 'row') + 1

  let width = 100, height = 100
  if (type === 'twoCell') {
    const toEls = getElementsByTagNS(anchor, XDR_NS, 'to')
    if (toEls.length > 0) {
      const brCol = xmlChildInt(toEls[0], XDR_NS, 'col') + 1
      const brRow = xmlChildInt(toEls[0], XDR_NS, 'row') + 1
      let w = 0
      for (let c = col; c < brCol; c++) w += (colWidths[c] || 64)
      let h = 0
      for (let r = row; r < brRow; r++) h += (rowHeights[r] || 20)
      width = w || 100
      height = h || 100
    }
  } else {
    const extEls = getElementsByTagNS(anchor, XDR_NS, 'ext')
    if (extEls.length > 0) {
      width = Math.round(parseInt(extEls[0].getAttribute('cx') || '0', 10) / 9525) || 100
      height = Math.round(parseInt(extEls[0].getAttribute('cy') || '0', 10) / 9525) || 100
    }
  }

  return { base64: media.base64, mediaType: media.mediaType, col, row, width, height }
}

function xmlChildInt(parent: Element, ns: string, localName: string): number {
  const els = getElementsByTagNS(parent, ns, localName)
  if (els.length === 0) return 0
  return parseInt(els[0].textContent || '0', 10)
}

function bufferLikeToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
