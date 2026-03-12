import ExcelJS from 'exceljs'

const wb = new ExcelJS.Workbook()
const ws = wb.addWorksheet('Invoice')

ws.columns = [
  { width: 18 },
  { width: 28 },
  { width: 14 },
  { width: 14 },
]

const headerFill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF2563EB' },
}
const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
const labelFont = { bold: true, size: 10 }
const thinBorder = {
  top: { style: 'thin' },
  bottom: { style: 'thin' },
  left: { style: 'thin' },
  right: { style: 'thin' },
}

const r1 = ws.addRow(['INVOICE'])
ws.mergeCells('A1:D1')
r1.getCell(1).font = { bold: true, size: 20, color: { argb: 'FF2563EB' } }
r1.height = 32

ws.addRow([])

addLabelValue(ws, 'From:', '{{company_name}}')
addLabelValue(ws, 'Address:', '{{company_address}}')
addLabelValue(ws, 'Phone:', '{{company_phone}}')
addLabelValue(ws, 'Email:', '{{company_email}}')

ws.addRow([])

addLabelValue(ws, 'Bill To:', '{{customer_name}}')
addLabelValue(ws, 'Address:', '{{customer_address}}')
addLabelValue(ws, 'Phone:', '{{customer_phone}}')
addLabelValue(ws, 'Email:', '{{customer_email}}')

ws.addRow([])

addLabelValue(ws, 'Invoice #:', '{{invoice_number}}')
addLabelValue(ws, 'Date:', '{{invoice_date}}')
addLabelValue(ws, 'Due Date:', '{{due_date}}')
addLabelValue(ws, 'Terms:', '{{terms}}')

ws.addRow([])

const tableHeaderRow = ws.addRow(['Description', 'Qty', 'Rate', 'Amount'])
tableHeaderRow.eachCell((cell) => {
  cell.fill = headerFill
  cell.font = headerFont
  cell.border = thinBorder
  cell.alignment = { horizontal: 'center' }
})

for (let i = 1; i <= 3; i++) {
  const row = ws.addRow([
    `{{item_desc_${i}}}`,
    `{{item_qty_${i}}}`,
    `{{item_rate_${i}}}`,
    `{{item_amount_${i}}}`,
  ])
  row.eachCell((cell) => {
    cell.border = thinBorder
  })
}

ws.addRow([])

const subtotalRow = ws.addRow(['', '', 'Subtotal:', '{{subtotal}}'])
subtotalRow.getCell(3).font = labelFont
subtotalRow.getCell(3).alignment = { horizontal: 'right' }
subtotalRow.getCell(3).border = thinBorder
subtotalRow.getCell(4).border = thinBorder

const taxRow = ws.addRow(['', '', 'Tax:', '{{tax}}'])
taxRow.getCell(3).font = labelFont
taxRow.getCell(3).alignment = { horizontal: 'right' }
taxRow.getCell(3).border = thinBorder
taxRow.getCell(4).border = thinBorder

const totalRow = ws.addRow(['', '', 'Total:', '{{total}}'])
totalRow.getCell(3).font = { bold: true, size: 12 }
totalRow.getCell(3).alignment = { horizontal: 'right' }
totalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
totalRow.getCell(4).font = { bold: true, size: 12 }
totalRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
totalRow.getCell(3).border = thinBorder
totalRow.getCell(4).border = thinBorder

ws.addRow([])
addLabelValue(ws, 'Notes:', '{{notes}}')

const buf = await wb.xlsx.writeBuffer()
import { writeFileSync } from 'fs'
writeFileSync('public/sample_invoice_template.xlsx', Buffer.from(buf))
console.log('Sample template created: public/sample_invoice_template.xlsx')

function addLabelValue(ws, label, value) {
  const row = ws.addRow([label, value])
  row.getCell(1).font = labelFont
  return row
}
