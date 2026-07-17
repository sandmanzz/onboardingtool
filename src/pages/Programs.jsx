import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  BookOpen,
  Trash2,
  Edit3,
  ArrowRight,
  Eye,
  Clock,
  FileText,
  Copy,
  BarChart3,
  FileDown,
} from 'lucide-react'
import useStore from '../store/useStore'
import useToastStore from '../store/useToastStore'
import IconButton from '../components/IconButton'
import InsightsDrawer from '../components/InsightsDrawer'
import { downloadProgramPdf } from '../utils/programPdf'

export default function Programs() {
  const navigate = useNavigate()
  const { programs, company, deleteProgram, duplicateProgram } = useStore()
  const [insightsProgramId, setInsightsProgramId] = useState(null)
  const [pdfLoadingId, setPdfLoadingId] = useState(null)
  const showToast = useToastStore((s) => s.showToast)

  const handleDownloadPdf = async (program) => {
    if (pdfLoadingId) return
    setPdfLoadingId(program.id)
    try {
      const shareUrl = program.shareToken ? `${window.location.origin}/share/${program.shareToken}` : null
      await downloadProgramPdf(program, company, shareUrl)
    } catch {
      showToast('Could not generate PDF', 'error')
    } finally {
      setPdfLoadingId(null)
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Programs</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create and manage structured onboarding journeys
          </p>
        </div>
        <button
          onClick={() => navigate('/programs/new')}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Program</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {programs.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={32} className="text-brand-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Start your first program
          </h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Onboarding programs guide new employees through structured stages of
            learning — from videos to checklists to readings.
          </p>
          <button
            onClick={() => navigate('/programs/new')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Create Program
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {programs.map((program) => {
            const stageCount = program.stages.length
            const materialCount = program.stages.reduce(
              (a, s) => a + s.materials.length,
              0
            )
            const estimatedDays = program.estimatedDays || stageCount * 2

            return (
              <div key={program.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {program.headerImage ? (
                    <img
                      src={program.headerImage}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <BookOpen size={20} className="text-brand-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{program.name}</h3>
                      <span
                        className={`badge ${
                          program.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {program.status === 'published' ? '● Published' : '○ Draft'}
                      </span>
                    </div>

                    {program.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {program.description}
                      </p>
                    )}

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {estimatedDays} days
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ArrowRight size={12} />
                        {stageCount} stage{stageCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText size={12} />
                        {materialCount} material{materialCount !== 1 ? 's' : ''}
                      </span>
                      {program.targetRole && (
                        <span className="badge bg-blue-50 text-blue-600 max-w-[120px] truncate">
                          {program.targetRole}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <div className="hidden sm:block">
                      <IconButton
                        icon={BarChart3}
                        label="Insights"
                        onClick={() => setInsightsProgramId(program.id)}
                        className="btn-ghost p-2"
                      />
                    </div>
                    <div className="hidden sm:block">
                      <IconButton
                        icon={Eye}
                        label="Preview"
                        onClick={() => navigate(`/programs/${program.id}/preview`)}
                        className="btn-ghost p-2"
                      />
                    </div>
                    <IconButton
                      icon={Edit3}
                      label="Edit"
                      onClick={() => navigate(`/programs/${program.id}`)}
                      className="btn-ghost p-2"
                    />
                    <IconButton
                      icon={Copy}
                      label="Duplicate"
                      onClick={() => duplicateProgram(program.id)}
                      className="btn-ghost p-2"
                    />
                    <div className="hidden sm:block">
                      <IconButton
                        icon={FileDown}
                        label={pdfLoadingId === program.id ? 'Generating…' : 'Download PDF'}
                        onClick={() => handleDownloadPdf(program)}
                        className="btn-ghost p-2"
                      />
                    </div>
                    <IconButton
                      icon={Trash2}
                      label="Delete"
                      onClick={() => {
                        if (confirm('Delete this program?')) deleteProgram(program.id)
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <InsightsDrawer programId={insightsProgramId} onClose={() => setInsightsProgramId(null)} />
    </div>
  )
}
