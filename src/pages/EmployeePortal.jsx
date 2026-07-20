import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, PartyPopper, Link2Off, Clock3, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { MaterialRenderer, MATERIAL_ICONS } from '../components/materials'

function InvalidLink() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
        <Link2Off size={24} className="text-gray-400" />
      </div>
      <p className="font-semibold text-gray-800">This link isn't working</p>
      <p className="text-sm text-gray-500 max-w-xs">
        Ask your manager to resend your onboarding link — it may have been reset or mistyped.
      </p>
    </div>
  )
}

function NoProgramYet({ employee, company, brandColor }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
        style={{ backgroundColor: brandColor }}
      >
        {employee.name.charAt(0)}
      </div>
      <p className="font-semibold text-gray-800">Hi {employee.name.split(' ')[0]}, welcome to {company?.name || 'the team'}!</p>
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Clock3 size={14} />
        Your onboarding program hasn't been set up yet
      </div>
      <p className="text-xs text-gray-400 max-w-xs">Check back soon, or ask your manager when it'll be ready.</p>
    </div>
  )
}

function AllDone({ employee, company, brandColor, totalMaterials }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: brandColor }}
      >
        <PartyPopper size={28} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">You're all set, {employee.name.split(' ')[0]}!</p>
        <p className="text-sm text-gray-500 mt-1">
          You've completed all {totalMaterials} steps of your onboarding at {company?.name}.
        </p>
      </div>
      <div className="badge bg-green-100 text-green-700 mt-1">
        <Check size={11} className="mr-1" /> Onboarding complete
      </div>
    </div>
  )
}

export default function EmployeePortal() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [portal, setPortal] = useState(null)
  const [completedIds, setCompletedIds] = useState([])
  const [details, setDetails] = useState({})
  const [activeStage, setActiveStage] = useState(0)
  const [activeMaterial, setActiveMaterial] = useState(0)

  const load = async () => {
    const { data, error } = await supabase.rpc('get_employee_portal', { p_token: token })
    setLoading(false)
    if (error || !data || data.error) {
      setPortal(null)
      return
    }
    setPortal(data)
    setCompletedIds((data.completed || []).map((c) => c.material_id))
    const d = {}
    ;(data.completed || []).forEach((c) => {
      if (c.detail != null) d[c.material_id] = c.detail
    })
    setDetails(d)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    )
  }

  if (!portal) return <InvalidLink />

  const { employee, company, program } = portal
  const brandColor = company?.primary_color || '#4f5fff'

  if (!program) return <NoProgramYet employee={employee} company={company} brandColor={brandColor} />

  const stages = program.stages || []
  const allMaterials = stages.flatMap((s) => s.materials)
  const doneCount = allMaterials.filter((m) => completedIds.includes(m.id)).length
  const progress = allMaterials.length > 0 ? Math.round((doneCount / allMaterials.length) * 100) : 0
  const isComplete = allMaterials.length > 0 && doneCount === allMaterials.length

  if (isComplete) {
    return <AllDone employee={employee} company={company} brandColor={brandColor} totalMaterials={allMaterials.length} />
  }

  const stage = stages[activeStage]
  const materials = stage?.materials || []
  const material = materials[activeMaterial]

  const handleComplete = async (matId) => {
    setCompletedIds((ids) => (ids.includes(matId) ? ids : [...ids, matId]))
    await supabase.rpc('mark_material_complete', { p_token: token, p_material_id: matId })
  }
  const handleDetail = async (matId, detail) => {
    setDetails((d) => ({ ...d, [matId]: detail }))
    await supabase.rpc('record_material_detail', { p_token: token, p_material_id: matId, p_detail: detail })
  }

  const goPrev = () => {
    if (activeMaterial > 0) setActiveMaterial((m) => m - 1)
    else if (activeStage > 0) {
      setActiveStage((s) => s - 1)
      setActiveMaterial(stages[activeStage - 1]?.materials.length - 1 || 0)
    }
  }
  const goNext = () => {
    if (activeMaterial < materials.length - 1) setActiveMaterial((m) => m + 1)
    else if (activeStage < stages.length - 1) {
      setActiveStage((s) => s + 1)
      setActiveMaterial(0)
    }
  }
  const atStart = activeStage === 0 && activeMaterial === 0
  const atEnd = activeStage === stages.length - 1 && activeMaterial === materials.length - 1

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2.5">
            {company?.logo_url ? (
              <img src={company.logo_url} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {company?.name?.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{program.name}</p>
              <p className="text-xs text-gray-400 truncate">{company?.name} · {employee.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: brandColor }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 w-9 text-right shrink-0">{progress}%</span>
          </div>
        </div>
      </div>

      {program.header_image_url && (
        <div className="max-w-lg mx-auto w-full px-4 pt-4">
          <img src={program.header_image_url} alt="" className="w-full h-36 object-cover rounded-2xl" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-28">
        {stage ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Stage {activeStage + 1} of {stages.length}
              </p>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{stage.name}</h2>
            {stage.description && <p className="text-sm text-gray-500 mb-4">{stage.description}</p>}

            {materials.length > 1 && (
              <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                {materials.map((mat, idx) => {
                  const Icon = MATERIAL_ICONS[mat.type] || Check
                  return (
                    <button
                      key={mat.id}
                      onClick={() => setActiveMaterial(idx)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                        idx === activeMaterial ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {completedIds.includes(mat.id) && <Check size={10} className="text-green-500" />}
                      <Icon size={13} />
                      {mat.title}
                    </button>
                  )
                })}
              </div>
            )}

            {material ? (
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{material.title}</h3>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{material.type}</p>
                  </div>
                  {completedIds.includes(material.id) && (
                    <span className="badge bg-green-100 text-green-700 shrink-0">
                      <Check size={10} className="mr-1" /> Done
                    </span>
                  )}
                </div>
                <MaterialRenderer
                  material={material}
                  completed={completedIds.includes(material.id)}
                  onComplete={() => handleComplete(material.id)}
                  onDetail={(detail) => handleDetail(material.id, detail)}
                  initialDetail={details[material.id]}
                  signerName={employee.name}
                />
              </div>
            ) : (
              <div className="card p-10 text-center text-gray-400 text-sm">Nothing here yet.</div>
            )}
          </>
        ) : (
          <div className="card p-10 text-center text-gray-400 text-sm">No stages yet.</div>
        )}
      </div>

      {/* Sticky bottom nav */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-3">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={goPrev}
            disabled={atStart}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-30 py-3"
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <button
            onClick={goNext}
            disabled={atEnd}
            className="flex-1 flex items-center justify-center gap-2 disabled:opacity-30 py-3 rounded-lg font-medium text-sm text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: brandColor }}
          >
            Next
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
