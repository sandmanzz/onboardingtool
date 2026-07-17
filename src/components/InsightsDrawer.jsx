import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Users, CheckCircle2, AlertTriangle, BarChart3,
  Clock, ChevronRight, TrendingUp,
} from 'lucide-react'
import useStore from '../store/useStore'

function getDaysSince(dateStr) {
  if (!dateStr) return 0
  const start = new Date(dateStr)
  const now = new Date('2026-07-17')
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'text-green-700 bg-green-50 border-green-200' },
  'on-track': { label: 'On Track', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  'at-risk': { label: 'At Risk', color: 'text-red-700 bg-red-50 border-red-200' },
}

export default function InsightsDrawer({ programId, onClose }) {
  const navigate = useNavigate()
  const { programs, employees } = useStore()
  const [tab, setTab] = useState('overview')

  const program = programs.find((p) => p.id === programId)
  const open = !!programId

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[520px] bg-gray-50 z-50 shadow-2xl transition-transform duration-300 overflow-y-auto ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {program && (
          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                  <TrendingUp size={13} />
                  Insights
                </div>
                <h2 className="text-lg font-bold text-gray-900 truncate">{program.name}</h2>
              </div>
              <button onClick={onClose} className="btn-ghost p-2 shrink-0">
                <X size={18} />
              </button>
            </div>

            <InsightsContent program={program} employees={employees} tab={tab} setTab={setTab} navigate={navigate} onNavigate={onClose} />
          </div>
        )}
      </div>
    </>
  )
}

function InsightsContent({ program, employees, tab, setTab, navigate, onNavigate }) {
  const allMaterials = program.stages.flatMap((s) => s.materials)
  const enrolled = employees.filter((e) => e.assignedProgramId === program.id)

  const enriched = enrolled.map((e) => {
    const total = allMaterials.length
    const done = e.completedMaterials.filter((mid) => allMaterials.some((m) => m.id === mid)).length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const daysSince = getDaysSince(e.startDate)
    const estDays = parseInt(program.estimatedDays) || null
    const status =
      pct === 100 ? 'completed' : estDays && daysSince > estDays && pct < 50 ? 'at-risk' : 'on-track'
    return { ...e, done, total, pct, daysSince, status }
  })

  const completedCount = enriched.filter((e) => e.status === 'completed').length
  const atRiskCount = enriched.filter((e) => e.status === 'at-risk').length
  const avgPct = enriched.length > 0 ? Math.round(enriched.reduce((a, e) => a + e.pct, 0) / enriched.length) : 0
  const completionRate = enriched.length > 0 ? Math.round((completedCount / enriched.length) * 100) : 0
  const avgDaysToComplete = (() => {
    const completed = enriched.filter((e) => e.status === 'completed')
    if (completed.length === 0) return null
    return Math.round(completed.reduce((a, e) => a + e.daysSince, 0) / completed.length)
  })()

  const summaryCards = [
    { label: 'Enrolled', value: enriched.length, icon: Users, color: 'text-gray-700 bg-gray-100' },
    { label: 'Avg. Progress', value: `${avgPct}%`, icon: BarChart3, color: 'text-brand-700 bg-brand-50' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle2, color: 'text-green-700 bg-green-50' },
    { label: 'At Risk', value: atRiskCount, icon: AlertTriangle, color: 'text-red-700 bg-red-50' },
  ]

  const stageBreakdown = program.stages.map((stage) => {
    const stageMatIds = stage.materials.map((m) => m.id)
    const finishedCount = enriched.filter(
      (e) => stageMatIds.length > 0 && stageMatIds.every((mid) => e.completedMaterials.includes(mid))
    ).length
    const pct = enriched.length > 0 ? Math.round((finishedCount / enriched.length) * 100) : 0
    return { ...stage, finishedCount, pct }
  })

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'results', label: 'Results' },
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

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {summaryCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={16} />
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {avgDaysToComplete !== null && (
            <div className="card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <p className="text-sm text-gray-600">
                Employees who finished took an average of{' '}
                <span className="font-semibold text-gray-900">{avgDaysToComplete} days</span>.
              </p>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Stage Completion</h3>
              <p className="text-xs text-gray-400 mt-0.5">Share of enrolled employees who finished each stage</p>
            </div>
            <div className="divide-y divide-gray-50">
              {stageBreakdown.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">No stages yet.</p>
              ) : (
                stageBreakdown.map((stage, idx) => (
                  <div key={stage.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-800">{idx + 1}. {stage.name}</p>
                      <span className="text-xs font-semibold text-gray-500 tabular-nums">
                        {stage.finishedCount}/{enriched.length}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${stage.pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'results' && (
        <div className="card overflow-hidden">
          {enriched.length === 0 ? (
            <p className="px-4 py-12 text-center text-gray-400 text-sm">
              No employees are enrolled in this program yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {enriched.map((e) => {
                const conf = STATUS_CONFIG[e.status]
                const initials = e.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div
                    key={e.id}
                    className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => { onNavigate(); navigate(`/employees/${e.id}`) }}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{e.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full rounded-full ${e.status === 'completed' ? 'bg-green-500' : e.status === 'at-risk' ? 'bg-red-500' : 'bg-brand-600'}`}
                            style={{ width: `${e.pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums">{e.done}/{e.total}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border shrink-0 ${conf.color}`}>
                      {conf.label}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
