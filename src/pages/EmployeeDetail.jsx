import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Trash2, CheckCircle2, Clock,
  ExternalLink, Video, FileText,
  ListChecks, ClipboardList, Wrench, FileSignature, Calendar,
  User, ChevronDown, Link2, Copy, MessageCircle, PenLine, Camera, X, FileCheck2,
} from 'lucide-react'
import useStore from '../store/useStore'
import useToastStore from '../store/useToastStore'
import { sendOnboardingWhatsApp } from '../utils/whatsapp'

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern', 'Probation', 'Freelance']

const MATERIAL_ICONS = {
  video: Video,
  reading: FileText,
  checklist: ListChecks,
  quiz: ClipboardList,
  task: Wrench,
  document: FileSignature,
  meeting: Calendar,
}

const AVATAR_COLORS = ['#4f5fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function avatarColor(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function getProgress(employee, programs) {
  if (!employee.assignedProgramId) return null
  const program = programs.find((p) => p.id === employee.assignedProgramId)
  if (!program) return null
  const allMaterials = program.stages.flatMap((s) => s.materials)
  const total = allMaterials.length
  if (total === 0) return { percent: 0, done: 0, total: 0, program, stages: program.stages }
  const done = allMaterials.filter((m) => employee.completedMaterials.includes(m.id)).length
  return { percent: Math.round((done / total) * 100), done, total, program, stages: program.stages }
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((new Date('2026-07-17') - new Date(dateStr)) / 86400000))
}

function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { employees, programs, company, addEmployee, updateEmployee, deleteEmployee, assignProgram, ensureEmployeeAccess } = useStore()
  const showToast = useToastStore((s) => s.showToast)
  const [linkCopied, setLinkCopied] = useState(false)

  const isNew = !id || id === 'new'
  const employee = isNew ? null : employees.find((e) => e.id === id)
  const departments = company?.departments || []

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: departments[0] || '',
    employmentType: 'Full-time',
    manager: '',
    startDate: new Date().toISOString().slice(0, 10),
    location: '',
    notes: '',
  })
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('details')
  const [expandedStages, setExpandedStages] = useState({})
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || '',
        department: employee.department || departments[0] || '',
        employmentType: employee.employmentType || 'Full-time',
        manager: employee.manager || '',
        startDate: employee.startDate || '',
        location: employee.location || '',
        notes: employee.notes || '',
      })
    }
  }, [id])

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return
    if (isNew) {
      addEmployee(form)
      navigate('/employees')
    } else {
      updateEmployee(id, form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleDelete = () => {
    if (window.confirm(`Remove ${employee?.name}? This cannot be undone.`)) {
      deleteEmployee(id)
      navigate('/employees')
    }
  }

  const handleAssign = (programId) => assignProgram(id, programId || null)

  const getOnboardingUrl = () => {
    const token = ensureEmployeeAccess(id)
    return `${window.location.origin}/start/${token}`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getOnboardingUrl())
    setLinkCopied(true)
    showToast('Onboarding link copied')
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const url = getOnboardingUrl()
    sendOnboardingWhatsApp({ employee, company, program: progress?.program, url, pct: progress?.percent ?? 0 })
  }

  const toggleStage = (stageId) =>
    setExpandedStages((s) => ({ ...s, [stageId]: !s[stageId] }))

  if (!isNew && !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">Employee not found.</p>
        <button onClick={() => navigate('/employees')} className="btn-primary">Back to Employees</button>
      </div>
    )
  }

  const progress = employee ? getProgress(employee, programs) : null
  const publishedPrograms = programs.filter((p) => p.status === 'published')
  const days = employee ? daysSince(employee.startDate) : 0

  const employmentTypeBadge = {
    'Full-time': 'bg-brand-50 text-brand-700',
    'Part-time': 'bg-purple-50 text-purple-700',
    'Contract': 'bg-amber-50 text-amber-700',
    'Intern': 'bg-cyan-50 text-cyan-700',
    'Probation': 'bg-orange-50 text-orange-700',
    'Freelance': 'bg-pink-50 text-pink-700',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/employees')} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {isNew ? 'Add Employee' : employee.name}
          </h1>
          {!isNew && (
            <p className="text-sm text-gray-500">{employee.role} · {employee.department}</p>
          )}
        </div>
        {!isNew && (
          <button onClick={handleDelete} className="btn-danger flex items-center gap-1.5">
            <Trash2 size={15} /> Remove
          </button>
        )}
      </div>

      {/* Profile card (edit mode) */}
      {!isNew && form.name && (
        <div className="card p-5 mb-5 flex items-center gap-4 flex-wrap">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: avatarColor(form.name) }}
          >
            {getInitials(form.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{form.name}</p>
            <p className="text-sm text-gray-500">{form.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${employmentTypeBadge[form.employmentType] || 'bg-gray-100 text-gray-600'}`}>
                {form.employmentType}
              </span>
              <span className="text-xs text-gray-400">
                {days === 0 ? 'Started today' : `${days} days in`}
              </span>
              {form.manager && (
                <span className="text-xs text-gray-400">· Reports to {form.manager}</span>
              )}
            </div>
          </div>
          {progress && (
            <div className="text-right shrink-0">
              <p className={`text-2xl font-bold tabular-nums ${progress.percent === 100 ? 'text-green-600' : 'text-brand-600'}`}>
                {progress.percent}%
              </p>
              <p className="text-xs text-gray-400">onboarding</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {!isNew && (
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'details', label: 'Details' },
            { key: 'onboarding', label: 'Onboarding' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Details tab ───────────────────────────────────────────── */}
      {(isNew || tab === 'details') && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Personal Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Budi Hartono"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Work Email *</label>
                <input
                  className="input w-full"
                  type="email"
                  placeholder="budi@yourcompany.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input w-full"
                  placeholder="+62 812-3456-7890"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Jakarta"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Employment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Job Title</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Kitchen Staff"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Department</label>
                <select
                  className="input w-full"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                >
                  {departments.length === 0 && (
                    <option value="">No departments — add in Company Profile</option>
                  )}
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Employment Type</label>
                <select
                  className="input w-full"
                  value={form.employmentType}
                  onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
                >
                  {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Start Date</label>
                <input
                  className="input w-full"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Direct Manager</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Andi Saputra"
                  value={form.manager}
                  onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-3">
            <div>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">HR Notes</h3>
              <p className="text-xs text-gray-400 mt-0.5">Internal only — not visible to the employee.</p>
            </div>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. Strong learner, prior experience at Warung Pak Haji. Check in after week 2."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => navigate('/employees')} className="btn-secondary">Cancel</button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.email.trim()}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={15} />
              {saved ? 'Saved!' : isNew ? 'Add Employee' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Onboarding tab ───────────────────────────────────────── */}
      {!isNew && tab === 'onboarding' && (
        <div className="space-y-4">

          {/* Summary strip */}
          {progress && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Progress',
                  value: `${progress.percent}%`,
                  sub: `${progress.done}/${progress.total} materials`,
                  color: progress.percent === 100 ? 'text-green-600' : 'text-brand-600',
                },
                {
                  label: 'Days Active',
                  value: days,
                  sub: progress.program?.estimatedDays ? `of ${progress.program.estimatedDays}-day program` : 'since start',
                  color: 'text-gray-900',
                },
                {
                  label: 'Status',
                  value: progress.percent === 100 ? 'Done ✓' : (days > (parseInt(progress.program?.estimatedDays) || 99) && progress.percent < 50 ? 'At Risk' : 'On Track'),
                  sub: progress.percent === 100 ? 'All complete' : `${progress.total - progress.done} remaining`,
                  color: progress.percent === 100 ? 'text-green-600' : (days > (parseInt(progress.program?.estimatedDays) || 99) && progress.percent < 50 ? 'text-amber-600' : 'text-brand-600'),
                },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="card p-4 text-center">
                  <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Program assignment */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Assigned Program</h3>
            <p className="text-xs text-gray-400 mb-4">Changing the program resets their progress.</p>
            <div className="space-y-2">
              <div
                onClick={() => handleAssign(null)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  !employee.assignedProgramId ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${!employee.assignedProgramId ? 'border-brand-600' : 'border-gray-300'}`}>
                  {!employee.assignedProgramId && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                </div>
                <span className="text-sm text-gray-500 italic">None — no program assigned</span>
              </div>

              {publishedPrograms.length === 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
                  No published programs yet.{' '}
                  <button onClick={() => navigate('/programs')} className="font-medium underline">
                    Create and publish one first.
                  </button>
                </div>
              )}

              {publishedPrograms.map((program) => {
                const isSelected = employee.assignedProgramId === program.id
                const totalMaterials = program.stages.flatMap((s) => s.materials).length
                return (
                  <div
                    key={program.id}
                    onClick={() => handleAssign(program.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected ? 'border-brand-300 bg-brand-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-brand-600' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{program.name}</p>
                      <p className="text-xs text-gray-500">{program.stages.length} stages · {totalMaterials} materials · {program.estimatedDays} days</p>
                    </div>
                    {isSelected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/programs/${program.id}/preview`) }}
                        className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                      >
                        Preview <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Onboarding link — the actual way this reaches the employee */}
          {employee.assignedProgramId && (
            <div className="card p-6 border-brand-200 bg-brand-50/30">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
                  <Link2 size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Onboarding Link</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Send this to {employee.name.split(' ')[0]} so they can complete their onboarding on their own phone — no login required.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="input flex-1 text-xs font-mono"
                  readOnly
                  value={getOnboardingUrl()}
                  onClick={(e) => e.target.select()}
                />
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleCopyLink} className="btn-secondary flex items-center gap-1.5 px-3 whitespace-nowrap">
                    <Copy size={14} />
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors whitespace-nowrap"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rich progress breakdown */}
          {progress && (
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Stage Breakdown</h3>
                  <span className={`text-sm font-bold ${progress.percent === 100 ? 'text-green-600' : 'text-brand-600'}`}>
                    {progress.percent}% complete
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progress.percent === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">{progress.done} of {progress.total} materials completed</p>
              </div>

              <div className="divide-y divide-gray-50">
                {progress.stages.map((stage, idx) => {
                  const stageMats = stage.materials
                  const stageDone = stageMats.filter((m) => employee.completedMaterials.includes(m.id)).length
                  const stageTotal = stageMats.length
                  const stagePct = stageTotal > 0 ? Math.round((stageDone / stageTotal) * 100) : 0
                  const isComplete = stageDone === stageTotal && stageTotal > 0
                  const isActive = !isComplete && stageDone > 0
                  const isOpen = expandedStages[stage.id]

                  return (
                    <div key={stage.id}>
                      <button
                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                        onClick={() => toggleStage(stage.id)}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isComplete ? 'bg-green-100 text-green-600' : isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isComplete ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{stage.name}</p>
                            {isComplete && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Done</span>}
                            {isActive && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">In Progress</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden w-24">
                              <div className={`h-full rounded-full ${isComplete ? 'bg-green-400' : 'bg-brand-400'}`} style={{ width: `${stagePct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 tabular-nums">{stageDone}/{stageTotal}</span>
                            {stage.deadline && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={10} /> Due day {stage.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronDown size={15} className={`text-gray-300 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 space-y-2">
                          {stage.description && (
                            <p
                              className="text-xs text-gray-500 italic mb-3 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: stage.description }}
                            />
                          )}
                          {stageMats.length === 0 && (
                            <p className="text-xs text-gray-400 py-2">No materials in this stage.</p>
                          )}
                          {stageMats.map((mat) => {
                            const done = employee.completedMaterials.includes(mat.id)
                            const Icon = MATERIAL_ICONS[mat.type] || FileText
                            const detail = (employee.materialDetails || {})[mat.id]
                            const photos = detail?.photos ? Object.values(detail.photos) : []
                            return (
                              <div
                                key={mat.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border text-sm bg-white ${done ? 'border-green-100' : 'border-gray-100'}`}
                              >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${done ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                  {done ? <CheckCircle2 size={14} /> : <Icon size={13} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate ${done ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'}`}>
                                    {mat.title}
                                  </p>
                                  <p className="text-xs text-gray-400 capitalize">{mat.type}</p>

                                  {/* Audit trail detail — the actual proof of completion */}
                                  {mat.type === 'quiz' && detail && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${detail.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {detail.score}% · {detail.passed ? 'Passed' : 'Failed'}
                                      </span>
                                      {detail.submittedAt && (
                                        <span className="text-[10px] text-gray-400">{formatDateTime(detail.submittedAt)}</span>
                                      )}
                                    </div>
                                  )}
                                  {mat.type === 'document' && detail?.signedBy && (
                                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-500">
                                      <PenLine size={11} className="text-brand-500 shrink-0" />
                                      Signed by <span className="font-medium text-gray-700">{detail.signedBy}</span>
                                      {detail.signedAt && <span className="text-gray-400">· {formatDateTime(detail.signedAt)}</span>}
                                    </div>
                                  )}
                                  {mat.type === 'checklist' && photos.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      {photos.map((p, i) => {
                                        const isLegacyString = typeof p === 'string'
                                        const src = isLegacyString ? p : p.url
                                        const isImage = isLegacyString ? true : p.isImage
                                        return isImage ? (
                                          <button key={i} onClick={() => setLightboxPhoto(src)} className="shrink-0">
                                            <img src={src} alt="" className="w-8 h-8 rounded-md object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                                          </button>
                                        ) : (
                                          <a
                                            key={i}
                                            href={src}
                                            download={p.name || 'proof'}
                                            title={p.name}
                                            className="w-8 h-8 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 hover:bg-gray-100"
                                          >
                                            <FileCheck2 size={13} className="text-gray-500" />
                                          </a>
                                        )
                                      })}
                                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                        <Camera size={10} /> proof
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span className={`text-xs font-medium shrink-0 ${done ? 'text-green-600' : 'text-gray-300'}`}>
                                  {done ? 'Completed' : 'Pending'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!progress && !employee.assignedProgramId && (
            <div className="card p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <User size={20} className="text-gray-400" />
              </div>
              <p className="font-medium text-gray-700 mb-1">No program assigned</p>
              <p className="text-sm text-gray-400">Select a program above to start tracking onboarding progress.</p>
            </div>
          )}
        </div>
      )}

      {/* Photo evidence lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setLightboxPhoto(null)}
        >
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X size={20} />
          </button>
          <img src={lightboxPhoto} alt="Checklist evidence" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  )
}
