import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BookOpen, Clock, Users, CheckCircle2, BarChart3, ListChecks, FileDown, Loader2, QrCode, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import QRCodeImage from '../components/QRCodeImage'
import { downloadProgramPdf } from '../utils/programPdf'

export default function PublicShare() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.rpc('get_shared_program', { p_token: token }).then(({ data, error }) => {
      if (cancelled) return
      setLoading(false)
      if (error || !data || data.error) {
        setShared(null)
        return
      }
      setShared(data)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    )
  }

  if (!shared) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
        <BookOpen size={32} className="text-gray-300" />
        <p className="text-gray-500">This link is invalid or no longer active.</p>
      </div>
    )
  }

  const { program, company, stages, stats: rawStats } = shared
  const brandColor = company?.primary_color || '#4f5fff'
  const materialCount = stages.reduce((sum, s) => sum + (s.material_count || 0), 0)

  const stats = [
    { label: 'Enrolled', value: rawStats.enrolled, icon: Users },
    { label: 'Avg. Progress', value: `${rawStats.avg_pct}%`, icon: BarChart3 },
    { label: 'Completion Rate', value: rawStats.enrolled ? `${Math.round((rawStats.completed / rawStats.enrolled) * 100)}%` : '0%', icon: CheckCircle2 },
  ]

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleDownloadPdf = async () => {
    if (pdfLoading) return
    setPdfLoading(true)
    try {
      await downloadProgramPdf(
        { ...program, headerImage: program.header_image_url, stages },
        { ...company, logo: company?.logo_url, primaryColor: company?.primary_color },
        shareUrl
      )
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          {company?.logo_url ? (
            <img src={company.logo_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
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
        {program.header_image_url && (
          <img src={program.header_image_url} alt="" className="w-full h-40 sm:h-56 object-cover rounded-2xl mb-6" />
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.name}</h1>
        {program.description && (
          <p
            className="text-sm text-gray-500 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: program.description }}
          />
        )}

        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400 mb-6">
          {program.target_role && <span className="badge bg-blue-50 text-blue-600">{program.target_role}</span>}
          {program.estimated_days && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {program.estimated_days} days
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <ListChecks size={12} /> {stages.length} stages · {materialCount} materials
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
            {stages.map((stage, idx) => (
              <div key={stage.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  {idx + 1}
                </div>
                <p className="text-sm font-medium text-gray-800 flex-1">{stage.name}</p>
                <span className="text-xs text-gray-400">{stage.material_count} materials</span>
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
