import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Trash2, User, Mail, Phone, MapPin,
  Briefcase, Calendar, BookOpen, CheckCircle2, Clock,
  AlertCircle, ExternalLink, ChevronRight, RotateCcw
} from 'lucide-react'
import useStore from '../store/useStore'

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Design', 'Operations', 'HR', 'Finance', 'Customer Success', 'Other']

const AVATAR_COLORS = [
  '#4f5fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16',
]
function avatarColor(name) {
  let hash = 0
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { employees, programs, addEmployee, updateEmployee, deleteEmployee, assignProgram } = useStore()

  const isNew = !id || id === 'new'
  const employee = isNew ? null : employees.find((e) => e.id === id)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: 'Engineering',
    startDate: new Date().toISOString().slice(0, 10),
    location: '',
  })
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('details') // 'details' | 'onboarding'

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || '',
        department: employee.department || 'Engineering',
        startDate: employee.startDate || '',
        location: employee.location || '',
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

  const handleAssign = (programId) => {
    assignProgram(id, programId || null)
  }

  if (!isNew && !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500">Employee not found.</p>
        <button onClick={() => navigate('/employees')} className="btn-primary">
          Back to Employees
        </button>
      </div>
    )
  }

  const progress = employee ? getProgress(employee, programs) : null
  const publishedPrograms = programs.filter((p) => p.status === 'published')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/employees')} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {isNew ? 'Add Employee' : employee.name}
          </h1>
          {!isNew && (
            <p className="text-sm text-gray-500">
              {employee.role} · {employee.department}
            </p>
          )}
        </div>
        {!isNew && (
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="btn-danger flex items-center gap-1.5">
              <Trash2 size={15} />
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Avatar (edit mode) */}
      {!isNew && form.name && (
        <div className="flex items-center gap-4 mb-6 p-5 card">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: avatarColor(form.name) }}
          >
            {getInitials(form.name)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{form.name}</p>
            <p className="text-sm text-gray-500">{form.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Started{' '}
              {new Date(employee.startDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Tabs (edit only) */}
      {!isNew && (
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
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

      {/* Details tab */}
      {(isNew || tab === 'details') && (
        <div className="card p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input w-full"
                placeholder="e.g. Sarah Johnson"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Work Email *</label>
              <input
                className="input w-full"
                type="email"
                placeholder="sarah@company.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Job Title</label>
              <input
                className="input w-full"
                placeholder="e.g. Senior Software Engineer"
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
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
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
            <div>
              <label className="label">Phone</label>
              <input
                className="input w-full"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Location</label>
              <input
                className="input w-full"
                placeholder="e.g. San Francisco, CA"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button onClick={() => navigate('/employees')} className="btn-secondary">
              Cancel
            </button>
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

      {/* Onboarding tab */}
      {!isNew && tab === 'onboarding' && (
        <div className="space-y-5">
          {/* Program assignment */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Assigned Program</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select an onboarding program for this employee. Changing the program resets their progress.
            </p>

            <div className="space-y-2">
              <div
                onClick={() => handleAssign(null)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  !employee.assignedProgramId
                    ? 'border-brand-300 bg-brand-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    !employee.assignedProgramId ? 'border-brand-600' : 'border-gray-300'
                  }`}
                >
                  {!employee.assignedProgramId && (
                    <div className="w-2 h-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <span className="text-sm text-gray-500 italic">None — no program assigned</span>
              </div>

              {publishedPrograms.length === 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
                  No published programs yet.{' '}
                  <button
                    onClick={() => navigate('/programs')}
                    className="font-medium underline"
                  >
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
                      isSelected
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-brand-600' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{program.name}</p>
                      <p className="text-xs text-gray-500">
                        {program.stages.length} stages · {totalMaterials} materials · {program.estimatedDays} days
                      </p>
                    </div>
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/programs/${program.id}/preview`)
                        }}
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

          {/* Progress breakdown */}
          {progress && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Onboarding Progress</h3>
                <span
                  className={`text-sm font-bold ${
                    progress.percent === 100 ? 'text-green-600' : 'text-brand-600'
                  }`}
                >
                  {progress.percent}%
                </span>
              </div>

              {/* Overall bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress.percent === 100 ? 'bg-green-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Stage breakdown */}
              <div className="space-y-3">
                {progress.stages.map((stage) => {
                  const stageMaterials = stage.materials
                  const stageDone = stageMaterials.filter((m) =>
                    employee.completedMaterials.includes(m.id)
                  ).length
                  const stageTotal = stageMaterials.length
                  const stagePct = stageTotal > 0 ? Math.round((stageDone / stageTotal) * 100) : 0
                  return (
                    <div key={stage.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {stageDone === stageTotal && stageTotal > 0 ? (
                            <CheckCircle2 size={13} className="text-green-500" />
                          ) : stageDone > 0 ? (
                            <Clock size={13} className="text-amber-500" />
                          ) : (
                            <AlertCircle size={13} className="text-gray-300" />
                          )}
                          <span className="text-sm text-gray-700 font-medium">{stage.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {stageDone}/{stageTotal}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stagePct === 100 ? 'bg-green-400' : 'bg-brand-400'
                          }`}
                          style={{ width: `${stagePct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-gray-400 mt-4">
                {progress.done} of {progress.total} materials completed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
