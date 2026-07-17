import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

function stripHtml(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export async function downloadProgramPdf(program, company, shareUrl) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  let y = margin

  doc.setFillColor(79, 95, 255)
  doc.rect(0, 0, pageWidth, 6, 'F')
  y += 24

  if (company?.name) {
    doc.setFontSize(10)
    doc.setTextColor(130)
    doc.setFont(undefined, 'normal')
    doc.text(company.name.toUpperCase(), margin, y)
    y += 20
  }

  const allMaterials = program.stages.flatMap((s) => s.materials)
  const hasQr = !!shareUrl
  const qrSize = 88
  const textWidth = pageWidth - margin * 2 - (hasQr ? qrSize + 20 : 0)

  doc.setFontSize(22)
  doc.setTextColor(17, 24, 39)
  doc.setFont(undefined, 'bold')
  const titleLines = doc.splitTextToSize(program.name || 'Onboarding Program', textWidth)
  doc.text(titleLines, margin, y)
  const titleStartY = y
  y += titleLines.length * 26 + 6

  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(140)
  const metaBits = []
  if (program.targetRole) metaBits.push(program.targetRole)
  if (program.estimatedDays) metaBits.push(`${program.estimatedDays} days`)
  metaBits.push(`${program.stages.length} stage${program.stages.length !== 1 ? 's' : ''}`)
  metaBits.push(`${allMaterials.length} material${allMaterials.length !== 1 ? 's' : ''}`)
  doc.text(metaBits.join('   ·   '), margin, y)
  y += 20

  const desc = stripHtml(program.description)
  if (desc) {
    doc.setFontSize(10.5)
    doc.setTextColor(80)
    const lines = doc.splitTextToSize(desc, textWidth)
    doc.text(lines, margin, y)
    y += lines.length * 13 + 8
  }

  if (hasQr) {
    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, { width: qrSize * 2, margin: 1 })
      const qrX = pageWidth - margin - qrSize
      doc.addImage(qrDataUrl, 'PNG', qrX, titleStartY, qrSize, qrSize)
      doc.setFontSize(7.5)
      doc.setTextColor(150)
      doc.text('Scan to view online', qrX + qrSize / 2, titleStartY + qrSize + 12, { align: 'center' })
    } catch {
      // QR generation failed — continue without it, the PDF is still useful
    }
  }

  y = Math.max(y, titleStartY + qrSize + 24)
  doc.setDrawColor(229, 231, 235)
  doc.line(margin, y, pageWidth - margin, y)
  y += 26

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  program.stages.forEach((stage, si) => {
    ensureSpace(40)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(17, 24, 39)
    doc.text(`${si + 1}. ${stage.name}`, margin, y)
    y += 17

    const stageDesc = stripHtml(stage.description)
    if (stageDesc) {
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(120)
      const lines = doc.splitTextToSize(stageDesc, pageWidth - margin * 2)
      ensureSpace(lines.length * 12 + 6)
      doc.text(lines, margin, y)
      y += lines.length * 12 + 8
    }

    if (stage.materials.length === 0) {
      doc.setFont(undefined, 'italic')
      doc.setFontSize(9.5)
      doc.setTextColor(170)
      doc.text('No materials in this stage yet.', margin + 12, y)
      y += 16
    }

    stage.materials.forEach((mat) => {
      ensureSpace(16)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10.5)
      doc.setTextColor(55, 65, 81)
      doc.text(`•  [${mat.type}]  ${mat.title}`, margin + 12, y)
      y += 15
    })
    y += 12
  })

  const filename = `${(program.name || 'onboarding-program').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`
  doc.save(filename)
}
