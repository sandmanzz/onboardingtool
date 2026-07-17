import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Video,
  ListChecks, FileText, Save, Eye, Edit2,
  Check, X, ChevronRight, ClipboardList, Wrench, FileSignature, Calendar, Clock,
  Image, BarChart3, Link2, Copy, QrCode, FileDown, Loader2,
} from 'lucide-react'
import useStore from '../store/useStore'
import useToastStore from '../store/useToastStore'
import MaterialEditor from '../components/MaterialEditor'
import RichTextEditor from '../components/RichTextEditor'
import InsightsDrawer from '../components/InsightsDrawer'
import QRCodeImage from '../components/QRCodeImage'
import { downloadProgramPdf } from '../utils/programPdf'

const MATERIAL_TYPES = [
  { type: 'video', icon: Video, label: 'Video', color: 'text-purple-600 bg-purple-50' },
  { type: 'reading', icon: FileText, label: 'Reading', color: 'text-blue-600 bg-blue-50' },
  { type: 'checklist', icon: ListChecks, label: 'Checklist', color: 'text-green-600 bg-green-50' },
  { type: 'quiz', icon: ClipboardList, label: 'Quiz', color: 'text-amber-600 bg-amber-50' },
  { type: 'task', icon: Wrench, label: 'Task', color: 'text-orange-600 bg-orange-50' },
  { type: 'document', icon: FileSignature, label: 'Document', color: 'text-rose-600 bg-rose-50' },
  { type: 'meeting', icon: Calendar, label: 'Meeting', color: 'text-indigo-600 bg-indigo-50' },
]

export default function ProgramEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { programs, company, addProgram, updateProgram, addStage, updateStage, deleteStage,
    addMaterial, updateMaterial, deleteMaterial, enableShare, disableShare } = useStore()
  const showToast = useToastStore((s) => s.showToast)
  const [pdfLoading, setPdfLoading] = useState(false)

  const isNew = id === 'new'
  const program = isNew ? null : programs.find((p) => p.id === id)

  const [form, setForm] = useState({
    name: program?.name || '',
    description: program?.description || '',
    targetRole: program?.targetRole || '',
    estimatedDays: program?.estimatedDays || '',
    status: program?.status || 'draft',
    headerImage: program?.headerImage || '',
  })
  const [linkCopied, setLinkCopied] = useState(false)
  const [activeProgramId, setActiveProgramId] = useState(isNew ? null : id)
  const [expandedStage, setExpandedStage] = useState(null)
  const [editingStage, setEditingStage] = useState(null)
  const [addingMaterial, setAddingMaterial] = useState(null)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [newStageName, setNewStageName] = useState('')
  const [showAddStage, setShowAddStage] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  const currentProgram = activeProgramId
    ? programs.find((p) => p.id === activeProgramId)
    : null

  const handleSaveInfo = () => {
    if (!form.name.trim()) return
    if (isNew && !activeProgramId) {
      addProgram(form)
      const newId = useStore.getState().programs.slice(-1)[0]?.id
      setActiveProgramId(newId)
      navigate(`/programs/${newId}`, { replace: true })
      showToast('Program created — now add your stages below')
    } else {
      updateProgram(activeProgramId || id, form)
      showToast('Program saved')
      navigate('/dashboard')
    }
  }

  const handleAddStage = () => {
    if (!newStageName.trim() || !activeProgramId) return
    addStage(activeProgramId, { name: newStageName.trim(), description: '', deadline: null })
    setNewStageName('')
    setShowAddStage(false)
    const prog = useStore.getState().programs.find((p) => p.id === activeProgramId)
    if (prog) setExpandedStage(prog.stages.slice(-1)[0]?.id)
  }

  const handleHeaderImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, headerImage: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleToggleShare = () => {
    if (!activeProgramId) return
    if (currentProgram?.shareToken) disableShare(activeProgramId)
    else enableShare(activeProgramId)
  }

  const shareUrl = currentProgram?.shareToken
    ? `${window.location.origin}/share/${currentProgram.shareToken}`
    : ''

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleDownloadPdf = async () => {
    if (!currentProgram || pdfLoading) return
    setPdfLoading(true)
    try {
      await downloadProgramPdf(currentProgram, company, shareUrl || null)
    } finally {
      setPdfLoading(false)
    }
  }

  const moveStage = (stageId, dir) => {
    if (!currentProgram) return
    const stages = [...currentProgram.stages]
    const idx = stages.findIndex((s) => s.id === stageId)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= stages.length) return
    ;[stages[idx], stages[swapIdx]] = [stages[swapIdx], stages[idx]]
    useStore.getState().reorderStages(activeProgramId, stages.map((s, i) => ({ ...s, order: i + 1 })))
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {isNew ? 'New Program' : form.name || 'Edit Program'}
          </h1>
          <p className="text-sm text-gray-500">Build your onboarding journey</p>
        </div>
        {activeProgramId && (
          <>
            <button
              onClick={() => setShowInsights(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Insights
            </button>
            <button
              onClick={() => navigate(`/programs/${activeProgramId}/preview`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Eye size={16} />
              Preview
            </button>
          </>
        )}
      </div>

      {/* Program Info */}
      <div className="card p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Program Details</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Header Image (optional)</label>
            {form.headerImage ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-1">
                <img src={form.headerImage} alt="" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, headerImage: '' }))}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 cursor-pointer text-sm text-gray-500 transition-all">
                <Image size={16} />
                Upload a banner image shown at the top of this program
                <input type="file" accept="image/*" className="hidden" onChange={handleHeaderImageChange} />
              </label>
            )}
          </div>
          <div>
            <label className="label">Program Name *</label>
            <input
              className="input"
              placeholder="e.g. Kitchen Staff Onboarding, Waiter Training"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Introduction / Description</label>
            <RichTextEditor
              value={form.description}
              onChange={(val) => setForm((f) => ({ ...f, description: val }))}
              placeholder="What will employees learn and accomplish in this program?"
              minRows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target Role</label>
              <input
                className="input"
                placeholder="e.g. Kitchen Staff, Waiter"
                value={form.targetRole}
                onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Total Duration (days)</label>
              <input
                className="input"
                type="number"
                placeholder="e.g. 7"
                value={form.estimatedDays}
                onChange={(e) => setForm((f) => ({ ...f, estimatedDays: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <div className="flex gap-2">
              {['draft', 'published'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                    form.status === s
                      ? s === 'published'
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-brand-50 border-brand-400 text-brand-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSaveInfo}
            disabled={!form.name.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} />
            {isNew && !activeProgramId ? 'Create Program' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Public share link */}
      {activeProgramId && (
        <div className="card p-6 mb-5">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Link2 size={16} className="text-gray-400" />
              Public Link
            </h2>
            <button
              type="button"
              onClick={handleToggleShare}
              className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${
                currentProgram?.shareToken ? 'bg-brand-600' : 'bg-gray-200'
              }`}
              style={{ height: '22px', width: '40px' }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                  currentProgram?.shareToken ? 'translate-x-[18px]' : ''
                }`}
                style={{ height: '18px', width: '18px' }}
              />
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Share a read-only overview dashboard for this program — no employee names or personal data included.
          </p>
          {currentProgram?.shareToken && (
            <div className="flex flex-col sm:flex-row gap-4">
              <QRCodeImage value={shareUrl} size={96} className="shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <input className="input flex-1 text-xs" readOnly value={shareUrl} onClick={(e) => e.target.select()} />
                  <button onClick={handleCopyShareUrl} className="btn-secondary shrink-0 flex items-center gap-1.5 px-3">
                    <Copy size={14} />
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <QrCode size={12} />
                  Scan the code to open the public dashboard on any phone
                </p>
              </div>
            </div>
          )}
          <div className={`flex items-center ${currentProgram?.shareToken ? 'mt-4 pt-4 border-t border-gray-100' : ''}`}>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="btn-secondary flex items-center gap-1.5 disabled:opacity-60"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
              Download as PDF
            </button>
          </div>
        </div>
      )}

      {/* Stages */}
      {activeProgramId && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Stages ({currentProgram?.stages.length || 0})
            </h2>
          </div>

          <div className="space-y-3">
            {(currentProgram?.stages || []).map((stage, idx) => {
              const isExpanded = expandedStage === stage.id
              const isEditing = editingStage === stage.id

              return (
                <div key={stage.id} className="card overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>

                    {isEditing ? (
                      <input
                        className="input flex-1 py-1"
                        value={stage.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          updateStage(activeProgramId, stage.id, { name: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') setEditingStage(null)
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{stage.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-gray-400">
                            {stage.materials.length} material{stage.materials.length !== 1 ? 's' : ''}
                          </p>
                          {stage.deadline && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              <Clock size={10} />
                              Due day {stage.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                        onClick={() => moveStage(stage.id, 'up')}
                        disabled={idx === 0}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                        onClick={() => moveStage(stage.id, 'down')}
                        disabled={idx === (currentProgram?.stages.length || 0) - 1}
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                        onClick={() => setEditingStage(isEditing ? null : stage.id)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        onClick={() => {
                          if (confirm('Delete this stage?')) deleteStage(activeProgramId, stage.id)
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight
                        size={16}
                        className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4">
                      {/* Stage cosmetics */}
                      <div className="pt-3 mb-4 space-y-3">
                        <div>
                          <label className="label">Stage Introduction (shown to employees)</label>
                          <RichTextEditor
                            value={stage.description || ''}
                            onChange={(val) => updateStage(activeProgramId, stage.id, { description: val })}
                            placeholder="Welcome text or instructions shown at the top of this stage..."
                            minRows={2}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock size={14} className="text-gray-400 shrink-0" />
                          <label className="label mb-0 shrink-0">Complete by day</label>
                          <input
                            className="input w-20"
                            type="number"
                            min={1}
                            placeholder="e.g. 3"
                            value={stage.deadline || ''}
                            onChange={(e) =>
                              updateStage(activeProgramId, stage.id, {
                                deadline: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                          />
                          <span className="text-sm text-gray-400">from start date</span>
                        </div>
                      </div>

                      {/* Materials list */}
                      <div className="space-y-2 mb-3">
                        {stage.materials.map((mat) => {
                          const conf = MATERIAL_TYPES.find((t) => t.type === mat.type)
                          const Icon = conf?.icon || FileText
                          return (
                            <div
                              key={mat.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 group"
                            >
                              <span className={`p-1.5 rounded-lg ${conf?.color}`}>
                                <Icon size={14} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {mat.title || `Untitled ${mat.type}`}
                                </p>
                                <p className="text-xs text-gray-400 capitalize">{mat.type}</p>
                              </div>
                              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  className="p-1.5 rounded hover:bg-white text-gray-400 hover:text-gray-600"
                                  onClick={() => setEditingMaterial({ stageId: stage.id, material: mat })}
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                                  onClick={() => deleteMaterial(activeProgramId, stage.id, mat.id)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Add material */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Add material:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {MATERIAL_TYPES.map(({ type: mType, icon: Icon, label, color }) => (
                            <button
                              key={mType}
                              onClick={() => setAddingMaterial({ stageId: stage.id, defaultType: mType })}
                              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 transition-all text-center"
                            >
                              <span className={`p-1.5 rounded-lg ${color}`}>
                                <Icon size={14} />
                              </span>
                              <span className="text-[11px] font-medium text-gray-600">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {showAddStage ? (
            <div className="card p-4 mt-3 flex items-center gap-3">
              <input
                className="input flex-1"
                placeholder="Stage name (e.g. Day 1–2: Food Safety)"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStage()
                  if (e.key === 'Escape') setShowAddStage(false)
                }}
                autoFocus
              />
              <button onClick={handleAddStage} className="btn-primary px-3">
                <Check size={16} />
              </button>
              <button onClick={() => setShowAddStage(false)} className="btn-ghost px-3">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddStage(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 text-sm font-medium text-gray-500 hover:text-brand-600 transition-all"
            >
              <Plus size={16} />
              Add Stage
            </button>
          )}
        </div>
      )}

      {/* Edit material modal */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Edit Material</h3>
              <button onClick={() => setEditingMaterial(null)} className="btn-ghost p-1.5">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <MaterialEditor
                initial={editingMaterial.material}
                onSave={(data) => {
                  updateMaterial(activeProgramId, editingMaterial.stageId, editingMaterial.material.id, data)
                  setEditingMaterial(null)
                }}
                onCancel={() => setEditingMaterial(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add material modal */}
      {addingMaterial && typeof addingMaterial === 'object' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Add Material</h3>
              <button onClick={() => setAddingMaterial(null)} className="btn-ghost p-1.5">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <MaterialEditor
                defaultType={addingMaterial.defaultType}
                onSave={(data) => {
                  addMaterial(activeProgramId, addingMaterial.stageId, data)
                  setAddingMaterial(null)
                }}
                onCancel={() => setAddingMaterial(null)}
              />
            </div>
          </div>
        </div>
      )}

      <InsightsDrawer
        programId={showInsights ? activeProgramId : null}
        onClose={() => setShowInsights(false)}
      />
    </div>
  )
}
