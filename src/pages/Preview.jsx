import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, FileText, BookOpen } from 'lucide-react'
import useStore from '../store/useStore'
import { MaterialRenderer, MATERIAL_ICONS } from '../components/materials'

export default function Preview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { programs, company } = useStore()

  const program = programs.find((p) => p.id === id)
  const [activeStage, setActiveStage] = useState(0)
  const [activeMaterial, setActiveMaterial] = useState(0)
  const [completedMaterials, setCompletedMaterials] = useState({})

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">Program not found</p>
        <button onClick={() => navigate('/programs')} className="btn-primary">
          Back to Programs
        </button>
      </div>
    )
  }

  const stages = program.stages || []
  const stage = stages[activeStage]
  const materials = stage?.materials || []
  const material = materials[activeMaterial]

  const markComplete = (matId) => {
    setCompletedMaterials((c) => ({ ...c, [matId]: true }))
  }

  const totalMaterials = stages.reduce((a, s) => a + s.materials.length, 0)
  const doneCount = Object.keys(completedMaterials).length
  const progress = totalMaterials > 0 ? Math.round((doneCount / totalMaterials) * 100) : 0

  const brandColor = company?.primaryColor || '#4f5fff'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost p-2">
              <ArrowLeft size={18} />
            </button>
            {company?.logo ? (
              <img src={company.logo} className="w-7 h-7 rounded-lg object-cover" alt="" />
            ) : (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: brandColor }}
              >
                {company?.name?.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{program.name}</p>
              <p className="text-xs text-gray-400">{company?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: brandColor }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 w-9 text-right">{progress}%</span>
            </div>
            <span className="hidden sm:inline-flex items-center text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
              Preview Mode
            </span>
          </div>
        </div>
      </div>

      {program.headerImage && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <img src={program.headerImage} alt="" className="w-full h-40 sm:h-56 object-cover rounded-2xl" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Stage nav - desktop */}
        <div className="hidden md:block w-64 shrink-0">
          <div className="sticky top-20 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-2">
              Stages
            </p>
            {stages.map((s, idx) => {
              const stageDone = s.materials.every((m) => completedMaterials[m.id])
              const isActive = idx === activeStage
              return (
                <button
                  key={s.id}
                  onClick={() => { setActiveStage(idx); setActiveMaterial(0) }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white shadow-sm border border-gray-100'
                      : 'hover:bg-white/60'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      stageDone
                        ? 'bg-green-100 text-green-700'
                        : isActive
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                    style={isActive && !stageDone ? { backgroundColor: brandColor } : {}}
                  >
                    {stageDone ? <Check size={12} /> : idx + 1}
                  </div>
                  <span className={`text-sm font-medium leading-snug text-left ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                    {s.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile stage selector */}
          <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
            {stages.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => { setActiveStage(idx); setActiveMaterial(0) }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${
                  idx === activeStage
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                style={idx === activeStage ? { backgroundColor: brandColor } : {}}
              >
                {idx + 1}. {s.name}
              </button>
            ))}
          </div>

          {stage ? (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">{stage.name}</h2>
                {stage.description && (
                  <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                )}
              </div>

              {/* Material tabs */}
              {materials.length > 1 && (
                <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                  {materials.map((mat, idx) => {
                    const Icon = MATERIAL_ICONS[mat.type] || FileText
                    return (
                      <button
                        key={mat.id}
                        onClick={() => setActiveMaterial(idx)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                          idx === activeMaterial
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {completedMaterials[mat.id] && (
                          <Check size={10} className="text-green-500" />
                        )}
                        <Icon size={13} />
                        {mat.title}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Material content */}
              {material ? (
                <div className="card p-6">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <h3 className="font-semibold text-gray-900">{material.title}</h3>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{material.type}</p>
                    </div>
                    {completedMaterials[material.id] && (
                      <span className="badge bg-green-100 text-green-700 shrink-0">
                        <Check size={10} className="mr-1" /> Done
                      </span>
                    )}
                  </div>

                  <MaterialRenderer
                    material={material}
                    completed={!!completedMaterials[material.id]}
                    onComplete={() => markComplete(material.id)}
                  />
                </div>
              ) : (
                <div className="card p-10 text-center text-gray-400">
                  <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No materials in this stage yet</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => {
                    if (activeMaterial > 0) setActiveMaterial((m) => m - 1)
                    else if (activeStage > 0) {
                      setActiveStage((s) => s - 1)
                      setActiveMaterial(stages[activeStage - 1]?.materials.length - 1 || 0)
                    }
                  }}
                  disabled={activeStage === 0 && activeMaterial === 0}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-30"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (activeMaterial < materials.length - 1) setActiveMaterial((m) => m + 1)
                    else if (activeStage < stages.length - 1) {
                      setActiveStage((s) => s + 1)
                      setActiveMaterial(0)
                    }
                  }}
                  disabled={
                    activeStage === stages.length - 1 &&
                    activeMaterial === materials.length - 1
                  }
                  className="btn-primary flex items-center gap-2 disabled:opacity-30"
                  style={{ backgroundColor: brandColor }}
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="card p-16 text-center text-gray-400">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p>No stages added yet. Go back and create some stages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
