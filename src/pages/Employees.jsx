import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, UserPlus, ChevronRight, CheckCircle2,
  Clock, AlertCircle, UserCheck, Calendar, Link2,
} from 'lucide-react'
import useStore from '../store/useStore'
import useToastStore from '../store/useToastStore'
import IconButton from '../components/IconButton'

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getProgress(employee, programs) {
  if (!employee.assignedProgramId) return null
  const program = programs.find((p) => p.id === employee.assignedProgramId)
  if (!program) return null
  const allMaterials = program.stages.flatMap((s) => s.materials)
  const total = allMaterials.length
  if (total === 0) return { percent: 0, done: 0, total: 0, program }
  const done = allMaterials.filter((m) => employee.completedMaterials.includes(m.id)).length
  return { percent: Math.round((done / total) * 100), done, total, program }
}

const AVATAR_COLORS = [
  '#4f5fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16',
]

function avatarColor(name) {
  let hash = 0
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function ProgressBadge({ progress }) {
  if (!progress) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <AlertCircle size={13} />
        Not assigned
      </span>
    )
  }
  if (progress.percent === 100) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={13} />
        Completed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-medium">
      <Clock size={13} />
      {progress.percent}% complete
    </span>
  )
}

export default function Employees() {
  const navigate = useNavigate()
  const { employees, programs, deleteEmployee, ensureEmployeeAccess } = useStore()
  const showToast = useToastStore((s) => s.showToast)

  const handleCopyLink = (e, emp) => {
    e.stopPropagation()
    const token = ensureEmployeeAccess(emp.id)
    navigator.clipboard.writeText(`${window.location.origin}/start/${token}`)
    showToast(`Onboarding link copied for ${emp.name.split(' ')[0]}`)
  }
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('All')

  const departments = ['All', ...new Set(employees.map((e) => e.department))]

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    const matchDept = deptFilter === 'All' || e.department === deptFilter
    return matchSearch && matchDept
  })

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Remove this employee? This cannot be undone.')) {
      deleteEmployee(id)
    }
  }

  // stats
  const assigned = employees.filter((e) => e.assignedProgramId).length
  const completed = employees.filter((e) => {
    const prog = getProgress(e, programs)
    return prog?.percent === 100
  }).length
  const inProgress = employees.filter((e) => {
    const prog = getProgress(e, programs)
    return prog && prog.percent > 0 && prog.percent < 100
  }).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your team and track onboarding progress.
          </p>
        </div>
        <button
          onClick={() => navigate('/employees/new')}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={17} />
          <span className="hidden sm:inline">Add Employee</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: employees.length, icon: Users, color: 'text-gray-700', bg: 'bg-gray-100' },
          { label: 'Assigned', value: assigned, icon: UserCheck, color: 'text-brand-700', bg: 'bg-brand-100' },
          { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100' },
          { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search by name, role, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                deptFilter === dept
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Employee list */}
      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          {employees.length === 0 ? (
            <>
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus size={24} className="text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No employees yet</h3>
              <p className="text-gray-500 text-sm mb-5">
                Add your first employee and assign an onboarding program.
              </p>
              <button onClick={() => navigate('/employees/new')} className="btn-primary mx-auto">
                <Plus size={16} className="mr-1.5" />
                Add First Employee
              </button>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No employees match your search.</p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((emp) => {
              const progress = getProgress(emp, programs)
              return (
                <div
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0"
                    style={{ backgroundColor: avatarColor(emp.name) }}
                  >
                    {getInitials(emp.name)}
                  </div>

                  {/* Name / role */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {emp.role} · {emp.department}
                    </p>
                  </div>

                  {/* Program */}
                  <div className="hidden sm:block w-48 shrink-0">
                    {progress ? (
                      <div>
                        <p className="text-xs text-gray-500 truncate mb-1">{progress.program.name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                progress.percent === 100 ? 'bg-green-500' : 'bg-brand-500'
                              }`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{progress.percent}%</span>
                        </div>
                      </div>
                    ) : (
                      <span
                        onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp.id}`) }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <AlertCircle size={11} />
                        Assign program
                      </span>
                    )}
                  </div>

                  {/* Status badge — mobile */}
                  <div className="sm:hidden">
                    <ProgressBadge progress={progress} />
                  </div>

                  {/* Start date */}
                  <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 shrink-0 w-28">
                    <Calendar size={12} />
                    {new Date(emp.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  {emp.assignedProgramId && (
                    <IconButton
                      icon={Link2}
                      label="Copy onboarding link"
                      onClick={(e) => handleCopyLink(e, emp)}
                      className="btn-ghost p-2 hidden sm:flex"
                      size={15}
                    />
                  )}

                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
