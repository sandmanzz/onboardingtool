// Minimal RFC4180-ish CSV parser — good enough for simple employee import sheets
// (handles quoted fields with commas, no nested quote escaping beyond "").
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  const pushField = () => { row.push(field); field = '' }
  const pushRow = () => { pushField(); rows.push(row); row = [] }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      pushField()
    } else if (char === '\n') {
      pushRow()
    } else if (char === '\r') {
      // skip — \r\n handled by the following \n
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) pushRow()

  const nonEmptyRows = rows.filter((r) => r.some((c) => c.trim() !== ''))
  if (nonEmptyRows.length === 0) return []

  const headers = nonEmptyRows[0].map((h) => h.trim().toLowerCase())
  return nonEmptyRows.slice(1).map((r) => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (r[i] || '').trim() })
    return obj
  })
}

export const EMPLOYEE_CSV_TEMPLATE = `name,email,role,department,phone,location,startDate,employmentType,manager,notes
Budi Hartono,budi.hartono@example.com,Kitchen Staff,Kitchen,+62 812-3456-7890,Jakarta,2026-07-20,Full-time,Andi Saputra,
Sari Wulandari,sari.wulandari@example.com,Waiter,Front of House,+62 857-9012-3456,Jakarta,2026-07-20,Full-time,Andi Saputra,
`
