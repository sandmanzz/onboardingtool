import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Users, CheckCircle2, AlertTriangle, Clock,
  Search, ChevronRight, UserX, BarChart3,
} from 'lucide-react'
import useStore from '../store/useStore'

function getDaysSince(dateStr) {
  if (!dateStr) return 0
  const start = new Date(dateStr)
  const now = new Date('2026-07-17') // fixed reference matching today
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
}

function getProgress(employee, programs) {
  if (!employee.assignedProgramId) return null
  const program = programs.find((p) => p.id === employee.assignedProgramId)
  if (!program) return null
  const allMats = program.stages.flatMap((s) => s.materials)
  const total = allMats.length
  if (total === 0) return { program, total: 0, completed: 0, pct: 0 }
  const completed = employee.completedMaterials.filter((id) =>
    allMats.some((m) => m.id === id)
  ).length
  return { program, total, completed, pct: Math.round((completed / total) * 100) }
}

function getStatus(employee, progress, daysSince) {
  if (!employee.assignedProgramId) return 'unassigned'
  if (!progress) return 'unassigned'
  if (progress.pct === 100) return 'completed'
  if (daysSince > 7 && progress.pct < 40) return 'at-risk'
  if (daysSince > 5 && progress.pct < 25) return 'at-risk'
  return 'on-track'
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'text-green-700 bg-green-50 border-green-200' },
  'on-track': { label: 'On Track', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  'at-risk': { label: 'At Risk', color: 'text-red-700 bg-red-50 border-red-200' },
  unassigned: { label: 'Not Assigned', color: 'text-gray-500 bg-gray-50 border-gray-200' },
}

function ProgressBar({ pct, status }) {
  const barColor =
    status === 'completed' ? 'bg-green-500' :
    status === 'at-risk' ? 'bg-red-500' :
    status === 'on-track' ? 'bg-brand-600' : 'bg-gray-200'

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-500 w-8 text-right tabular-nums">{pct}%</span>
    </div>
  )
}

export default function Performance() {
  const { employees, programs } = useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDept, setFilterDept] = useState('all')

  const enriched = employees.map((e) => {
    const daysSince = getDaysSince(e.startDate)
    const progress = getProgress(e, programs)
    const status = getStatus(e, progress, daysSince)
    return { ...e, daysSince, progress, status }
  })

  const departments = ['all', ...new Set(employees.map((e) => e.department).filter(Boolean))]

  const filtered = enriched.filter((e) => {
    const matchSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || e.status === filterStatus
    const matchDept = filterDept === 'all' || e.department === filterDept
    return matchSearch && matchStatus && matchDept
  })

  // Summary stats
  const total = enriched.length
  const withProgram = enriched.filter((e) => e.assignedProgramId).length
  const completed = enriched.filter((e) => e.status === 'completed').length
  const atRisk = enriched.filter((e) => e.status === 'at-risk').length
  const avgPct =
    withProgram === 0
      ? 0
      : Math.round(
          enriched
            .filter((e) => e.progress)
            .reduce((sum, e) => sum + (e.progress?.pct || 0), 0) /
            Math.max(withProgram, 1)
        )

  const stats = [
    { label: 'Total Employees', value: total, icon: Users, color: 'text-gray-700 bg-gray-100' },
    { label: 'Avg. Progress', value: `${avgPct}%`, icon: BarChart3, color: 'text-brand-700 bg-brand-50' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-green-700 bg-green-50' },
    { label: 'At Risk', value: atRisk, icon: AlertTriangle, color: 'text-red-700 bg-red-50' },
  ]

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
          <TrendingUp size={13} />
          Analytics
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Performance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track onboarding progress and identify who needs support.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={16} />
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* At-risk callout */}
      {atRisk > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {atRisk} employee{atRisk !== 1 ? 's' : ''} at risk
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              These employees have been in their program for more than 5 days but made less than 40% progress. Consider checking in with them directly.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {/* Status filter */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            {['all', 'on-track', 'at-risk', 'completed', 'unassigned'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 capitalize transition-colors ${
                  filterStatus === s
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Department tabs */}
      {departments.length > 2 && (
        <div className="flex gap-1 mb-4 flex-wrap">
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setFilterDept(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filterDept === d
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d === 'all' ? 'All Departments' : d}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Employee
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Program
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Progress
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Days Active
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No employees match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const statusConf = STATUS_CONFIG[e.status]
                  const initials = e.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  const pct = e.progress?.pct ?? 0
                  const stageCount = e.progress?.program?.stages?.length ?? 0
                  const currentStageIdx = e.progress?.program?.stages?.findIndex((s) => {
                    const stageMatIds = s.materials.map((m) => m.id)
                    return stageMatIds.some((id) => !e.completedMaterials.includes(id))
                  })
                  const currentStage = e.progress?.program?.stages?.[currentStageIdx < 0 ? stageCount - 1 : currentStageIdx]

                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/employees/${e.id}`)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{e.name}</p>
                            <p className="text-xs text-gray-400">{e.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {e.progress ? (
                          <div>
                            <p className="text-gray-700 font-medium text-xs">{e.progress.program.name}</p>
                            {currentStage && e.status !== 'completed' && (
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">{currentStage.name}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {e.progress ? (
                          <div className="min-w-[100px]">
                            <ProgressBar pct={pct} status={e.status} />
                            <p className="text-xs text-gray-400 mt-1">
                              {e.progress.completed}/{e.progress.total} completed
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <UserX size={13} />
                            No program
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock size={13} className="text-gray-400" />
                          {e.daysSince === 0 ? 'Today' : `${e.daysSince}d`}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusConf.color}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <ChevronRight size={16} className="text-gray-300" />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Showing {filtered.length} of {enriched.length} employees</span>
          <span>Updated today</span>
        </div>
      </div>
    </div>
  )
}
