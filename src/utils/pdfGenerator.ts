import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Captures a DOM element as a high-fidelity PDF.
 * The element should be the rich HTML table rendered by InvoicePreview.
 */
export async function generatePdfFromElement(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove())
    },
  })

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = canvas.width
  const imgHeight = canvas.height

  const pdfWidth = 210
  const pdfMargin = 10
  const contentWidth = pdfWidth - pdfMargin * 2
  const contentHeight = (imgHeight / imgWidth) * contentWidth

  const pageHeight = 297 - pdfMargin * 2

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  if (contentHeight <= pageHeight) {
    doc.addImage(imgData, 'PNG', pdfMargin, pdfMargin, contentWidth, contentHeight)
  } else {
    const totalPages = Math.ceil(contentHeight / pageHeight)
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage()
      const srcY = (page * pageHeight / contentHeight) * imgHeight
      const srcH = Math.min((pageHeight / contentHeight) * imgHeight, imgHeight - srcY)
      const destH = (srcH / imgHeight) * contentHeight

      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = imgWidth
      sliceCanvas.height = srcH
      const ctx = sliceCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, srcY, imgWidth, srcH, 0, 0, imgWidth, srcH)

      const sliceData = sliceCanvas.toDataURL('image/png')
      doc.addImage(sliceData, 'PNG', pdfMargin, pdfMargin, contentWidth, destH)
    }
  }

  doc.save(filename)
}
