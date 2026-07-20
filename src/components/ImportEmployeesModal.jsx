import { useState } from 'react'
import { X, Upload, Download, CheckCircle2, AlertTriangle } from 'lucide-react'
import useStore from '../store/useStore'
import useToastStore from '../store/useToastStore'
import { parseCsv, EMPLOYEE_CSV_TEMPLATE } from '../utils/csv'

export default function ImportEmployeesModal({ open, onClose }) {
  const addEmployee = useStore((s) => s.addEmployee)
  const showToast = useToastStore((s) => s.showToast)
  const [rows, setRows] = useState(null)
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)

  if (!open) return null

  const reset = () => { setRows(null); setFileName('') }

  const handleClose = () => { reset(); onClose() }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCsv(String(ev.target.result))
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleDownloadSample = () => {
    const blob = new Blob([EMPLOYEE_CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee-import-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const validRows = (rows || []).filter((r) => r.name && r.email)
  const invalidCount = (rows || []).length - validRows.length

  const handleImport = () => {
    if (validRows.length === 0 || importing) return
    setImporting(true)
    validRows.forEach((r) => {
      addEmployee({
        name: r.name,
        email: r.email,
        role: r.role || '',
        department: r.department || '',
        phone: r.phone || '',
        location: r.location || '',
        startDate: r.startdate || new Date().toISOString().slice(0, 10),
        employmentType: r.employmenttype || 'Full-time',
        manager: r.manager || '',
        notes: r.notes || '',
      })
    })
    setImporting(false)
    showToast(`Imported ${validRows.length} employee${validRows.length !== 1 ? 's' : ''}`)
    handleClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Import Employees</h3>
            <p className="text-xs text-gray-400 mt-0.5">Bring in your whole team at once from a CSV file</p>
          </div>
          <button onClick={handleClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {!rows ? (
            <>
              <label className="flex flex-col items-center gap-2 p-8 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 cursor-pointer text-center transition-all">
                <Upload size={22} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Choose a CSV file</span>
                <span className="text-xs text-gray-400">Columns: name, email, role, department, phone, location, startDate…</span>
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
              </label>
              <button
                onClick={handleDownloadSample}
                className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium mx-auto"
              >
                <Download size={14} />
                Download a sample CSV
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 truncate">{fileName}</span>
                <button onClick={reset} className="text-brand-600 hover:text-brand-700 font-medium shrink-0">
                  Choose different file
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={13} /> {validRows.length} ready to import
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    <AlertTriangle size={13} /> {invalidCount} skipped (missing name/email)
                  </span>
                )}
              </div>

              {validRows.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                    {validRows.map((r, i) => (
                      <div key={i} className="px-3 py-2 flex items-center gap-3 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{r.name}</p>
                          <p className="text-xs text-gray-400 truncate">{r.email}</p>
                        </div>
                        {r.role && <span className="text-xs text-gray-400 shrink-0">{r.role}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {rows && (
          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button onClick={handleClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              Import {validRows.length || ''} Employee{validRows.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
