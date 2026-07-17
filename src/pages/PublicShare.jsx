import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BookOpen, Clock, Users, CheckCircle2, BarChart3, ListChecks, FileDown, Loader2, QrCode, X } from 'lucide-react'
import useStore from '../store/useStore'
import QRCodeImage from '../components/QRCodeImage'
import { downloadProgramPdf } from '../utils/programPdf'

export default function PublicShare() {
  const { token } = useParams()
  const { programs, employees, company } = useStore()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showQr, setShowQr] = useState(false)

  const program = programs.find((p) => p.shareToken === token)

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
        <BookOpen size={32} className="text-gray-300" />
        <p className="text-gray-500">This link is invalid or no longer active.</p>
      </div>
    )
  }

  const brandColor = company?.primaryColor || '#4f5fff'
  const allMaterials = program.stages.flatMap((s) => s.materials)
  const enrolled = employees.filter((e) => e.assignedProgramId === program.id)
  const completedCount = enrolled.filter((e) => {
    const total = allMaterials.length
    const done = e.completedMaterials.filter((mid) => allMaterials.some((m) => m.id === mid)).length
    return total > 0 && done === total
  }).length
  const avgPct = enrolled.length
    ? Math.round(
        enrolled.reduce((sum, e) => {
          const total = allMaterials.length
          const done = e.completedMaterials.filter((mid) => allMaterials.some((m) => m.id === mid)).length
          return sum + (total > 0 ? (done / total) * 100 : 0)
        }, 0) / enrolled.length
      )
    : 0
  const completionRate = enrolled.length ? Math.round((completedCount / enrolled.length) * 100) : 0

  const stats = [
    { label: 'Enrolled', value: enrolled.length, icon: Users },
    { label: 'Avg. Progress', value: `${avgPct}%`, icon: BarChart3 },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle2 },
  ]

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleDownloadPdf = async () => {
    if (pdfLoading) return
    setPdfLoading(true)
    try {
      await downloadProgramPdf(program, company, shareUrl)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          {company?.logo ? (
            <img src={company.logo} className="w-8 h-8 rounded-lg object-cover" alt="" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: brandColor }}
            >
              {company?.name?.charAt(0)}
            </div>
          )}
          <p className="text-sm font-semibold text-gray-900">{company?.name}</p>
          <span className="ml-auto hidden sm:inline-flex text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
            Public Dashboard
          </span>
          <button onClick={() => setShowQr(true)} className="btn-ghost p-2" title="Show QR code">
            <QrCode size={16} />
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            <span className="hidden sm:inline">Download PDF</span>
          </button>
        </div>
      </div>

      {showQr && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Scan to open</p>
              <button onClick={() => setShowQr(false)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>
            <QRCodeImage value={shareUrl} size={200} />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {program.headerImage && (
          <img src={program.headerImage} alt="" className="w-full h-40 sm:h-56 object-cover rounded-2xl mb-6" />
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.name}</h1>
        {program.description && (
          <p
            className="text-sm text-gray-500 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: program.description }}
          />
        )}

        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400 mb-6">
          {program.targetRole && <span className="badge bg-blue-50 text-blue-600">{program.targetRole}</span>}
          {program.estimatedDays && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {program.estimatedDays} days
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <ListChecks size={12} /> {program.stages.length} stages · {allMaterials.length} materials
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-2">
                <Icon size={16} />
              </div>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Program Structure</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {program.stages.map((stage, idx) => (
              <div key={stage.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  {idx + 1}
                </div>
                <p className="text-sm font-medium text-gray-800 flex-1">{stage.name}</p>
                <span className="text-xs text-gray-400">{stage.materials.length} materials</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-8">
          This is a read-only summary — no employee names or personal data are shown.
        </p>
      </div>
    </div>
  )
}
