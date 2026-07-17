import { useNavigate } from 'react-router-dom'
import { X, FilePlus2, ArrowRight } from 'lucide-react'
import useStore from '../store/useStore'
import { PROGRAM_TEMPLATES } from '../data/programTemplates'

export default function NewProgramModal({ open, onClose }) {
  const navigate = useNavigate()
  const addProgramFromTemplate = useStore((s) => s.addProgramFromTemplate)

  if (!open) return null

  const handleUseTemplate = (template) => {
    addProgramFromTemplate(template)
    const programs = useStore.getState().programs
    const newId = programs[programs.length - 1]?.id
    onClose()
    navigate(`/programs/${newId}`)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">New Program</h3>
            <p className="text-xs text-gray-400 mt-0.5">Start from a template or build your own from scratch</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <button
            onClick={() => { onClose(); navigate('/programs/new') }}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FilePlus2 size={18} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">Start from scratch</p>
              <p className="text-xs text-gray-500">A blank program — add your own stages and materials</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 shrink-0" />
          </button>

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
              Or start from a template
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {PROGRAM_TEMPLATES.map((t) => {
                const materialCount = t.stages.reduce((a, s) => a + s.materials.length, 0)
                return (
                  <button
                    key={t.id}
                    onClick={() => handleUseTemplate(t)}
                    className="flex flex-col gap-2 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{t.icon}</span>
                      <span className="badge bg-gray-100 text-gray-500 text-[10px]">{t.category}</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{t.description}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {t.stages.length} stages · {materialCount} materials · {t.estimatedDays} days
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
