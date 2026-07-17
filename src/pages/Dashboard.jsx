import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, AlertTriangle, Clock, ArrowRight, Plus,
  UserX, ChevronRight, Zap, Users, MessageCircle,
} from 'lucide-react'
import useStore from '../store/useStore'
import { sendOnboardingWhatsApp } from '../utils/whatsapp'
import NewProgramModal from '../components/NewProgramModal'

const AVATAR_COLORS = ['#4f5fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function avatarBg(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const TODAY = new Date('2026-07-17')

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((TODAY - new Date(dateStr)) / 86400000))
}

function getProgressData(employee, programs) {
  if (!employee.assignedProgramId) return null
  const program = programs.find(p => p.id === employee.assignedProgramId)
  if (!program) return null
  const allMats = program.stages.flatMap(s => s.materials)
  const total = allMats.length
  const done = allMats.filter(m => employee.completedMaterials.includes(m.id)).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return { program, total, done, pct }
}

function getCurrentStage(employee, program) {
  if (!program) return null
  for (const stage of program.stages) {
    if (!stage.materials.every(m => employee.completedMaterials.includes(m.id))) return stage
  }
  return program.stages[program.stages.length - 1]
}

function getStatus(employee, progress, days) {
  if (!employee.assignedProgramId) return 'unassigned'
  if (!progress) return 'unassigned'
  if (progress.pct === 100) return 'completed'
  const estDays = parseInt(progress.program?.estimatedDays) || 0
  if (estDays && days > estDays && progress.pct < 50) return 'at-risk'
  if (days > 5 && progress.pct < 25) return 'at-risk'
  return 'on-track'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function Avatar({ name, size = 'md' }) {
  const cls = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }[size]
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: avatarBg(name) }}
    >
      {getInitials(name)}
    </div>
  )
}

function Bar({ pct, variant = 'default' }) {
  const color = {
    completed: 'bg-green-500',
    'at-risk': 'bg-amber-500',
    default: 'bg-brand-500',
  }[variant] || 'bg-brand-500'
  return (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-1.5 ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { company, programs, employees, ensureEmployeeAccess } = useStore()
  const [showNewProgram, setShowNewProgram] = useState(false)

  const handleRemind = (evt, e) => {
    evt.stopPropagation()
    const token = ensureEmployeeAccess(e.id)
    const url = `${window.location.origin}/start/${token}`
    sendOnboardingWhatsApp({ employee: e, company, program: e.progress?.program, url, pct: e.progress?.pct ?? 0 })
  }

  const enriched = employees.map(e => {
    const days = daysSince(e.startDate)
    const progress = getProgressData(e, programs)
    const status = getStatus(e, progress, days)
    const currentStage = progress ? getCurrentStage(e, progress.program) : null
    return { ...e, days, progress, status, currentStage }
  })

  const byStatus = {
    atRisk: enriched.filter(e => e.status === 'at-risk'),
    onTrack: enriched.filter(e => e.status === 'on-track'),
    completed: enriched.filter(e => e.status === 'completed'),
    unassigned: enriched.filter(e => e.status === 'unassigned'),
  }

  const needsAttention = byStatus.atRisk.length + byStatus.unassigned.length

  const teamCards = [
    ...byStatus.atRisk,
    ...byStatus.onTrack.sort((a, b) => b.days - a.days),
    ...byStatus.completed,
  ]

  const programCards = programs.map(prog => {
    const enrolled = enriched.filter(e => e.progress?.program?.id === prog.id)
    const avgPct = enrolled.length
      ? Math.round(enrolled.reduce((s, e) => s + (e.progress?.pct || 0), 0) / enrolled.length)
      : 0
    const hasRisk = enrolled.some(e => e.status === 'at-risk')
    const doneCount = enrolled.filter(e => e.status === 'completed').length
    return { ...prog, enrolled, avgPct, hasRisk, doneCount }
  })

  const withProgram = enriched.filter(e => e.assignedProgramId)
  const avgTeamPct = withProgram.length
    ? Math.round(withProgram.reduce((s, e) => s + (e.progress?.pct || 0), 0) / withProgram.length)
    : 0

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {company?.name || 'Your Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {employees.length === 0
              ? 'Start by adding your first employee.'
              : needsAttention > 0
              ? `${needsAttention} item${needsAttention !== 1 ? 's' : ''} need${needsAttention === 1 ? 's' : ''} your attention today.`
              : 'All onboardings are running smoothly today.'}
          </p>
        </div>
        {employees.length > 0 && (
          <button
            onClick={() => navigate('/employees/new')}
            className="btn-primary shrink-0 items-center gap-2 hidden sm:flex"
          >
            <Plus size={15} /> Add Employee
          </button>
        )}
      </div>

      {/* Status pills */}
      {employees.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {byStatus.onTrack.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              {byStatus.onTrack.length} On Track
            </span>
          )}
          {byStatus.atRisk.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
              <AlertTriangle size={11} />
              {byStatus.atRisk.length} Needs Attention
            </span>
          )}
          {byStatus.completed.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <CheckCircle2 size={11} />
              {byStatus.completed.length} Completed
            </span>
          )}
          {byStatus.unassigned.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
              <UserX size={11} />
              {byStatus.unassigned.length} Unassigned
            </span>
          )}
          {withProgram.length > 0 && (
            <span className="ml-auto text-xs text-gray-400 hidden sm:block">
              Avg. team progress{' '}
              <strong className="text-gray-700">{avgTeamPct}%</strong>
            </span>
          )}
        </div>
      )}

      {/* Attention banners */}
      {needsAttention > 0 && (
        <div className="mb-6 space-y-2">
          {byStatus.atRisk.map(e => {
            const estDays = parseInt(e.progress?.program?.estimatedDays) || 0
            const overDays = estDays > 0 ? e.days - estDays : 0
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100/60 transition-colors"
                onClick={() => navigate(`/employees/${e.id}`)}
              >
                <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900">{e.name} is falling behind</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {overDays > 0
                      ? `${e.days} days active on a ${estDays}-day program — only ${e.progress?.pct}% done. ${overDays}d past target.`
                      : `${e.days} days in — only ${e.progress?.pct}% done. Consider checking in.`}
                  </p>
                </div>
                <button
                  onClick={(evt) => handleRemind(evt, e)}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white shrink-0"
                  title="Send a WhatsApp reminder"
                >
                  <MessageCircle size={12} />
                  Remind
                </button>
                <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 shrink-0">
                  View <ChevronRight size={13} />
                </span>
              </div>
            )
          })}
          {byStatus.unassigned.map(e => (
            <div
              key={e.id}
              className="flex items-center gap-3 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl"
            >
              <Avatar name={e.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{e.name}</p>
                <p className="text-xs text-gray-500">
                  {e.role} · Started{' '}
                  {e.days === 0 ? 'today' : e.days === 1 ? 'yesterday' : `${e.days} days ago`}{' '}
                  · No program assigned yet
                </p>
              </div>
              <button
                onClick={() => navigate(`/employees/${e.id}`)}
                className="btn-primary text-xs px-3 py-1.5 shrink-0"
              >
                Assign →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {employees.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-brand-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Ready to onboard your first employee?</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Add an employee, assign a program, and track their progress right here.
          </p>
          <div className="flex items-center gap-3 justify-center">
            {programs.length === 0 && (
              <button onClick={() => setShowNewProgram(true)} className="btn-secondary">
                Create Program first
              </button>
            )}
            <button onClick={() => navigate('/employees/new')} className="btn-primary">
              <Plus size={15} className="mr-1.5" /> Add Employee
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Left: Team (3 cols) ─────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Your Team</h2>
              <button
                onClick={() => navigate('/employees')}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {teamCards.map(e => {
                const { status, progress, currentStage, days } = e

                if (status === 'completed') {
                  return (
                    <div
                      key={e.id}
                      onClick={() => navigate(`/employees/${e.id}`)}
                      className="card border-l-4 border-l-green-400 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <Avatar name={e.name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900">{e.name}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            <CheckCircle2 size={9} /> Completed
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{e.role} · {progress?.program?.name}</p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          All {progress?.total} materials done · Finished in {days} days
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </div>
                  )
                }

                if (status === 'at-risk') {
                  const estDays = parseInt(progress?.program?.estimatedDays) || 0
                  const overDays = estDays > 0 ? days - estDays : 0
                  return (
                    <div
                      key={e.id}
                      onClick={() => navigate(`/employees/${e.id}`)}
                      className="card border-l-4 border-l-amber-400 bg-amber-50/30 p-4 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={e.name} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-gray-900">{e.name}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              <AlertTriangle size={9} /> Needs Attention
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{e.role} · {progress?.program?.name}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                      </div>
                      {currentStage && (
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-medium">On:</span> {currentStage.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <Bar pct={progress?.pct} variant="at-risk" />
                        <span className="text-xs font-bold text-amber-600 tabular-nums shrink-0">{progress?.pct}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">{progress?.done}/{progress?.total} completed</p>
                        <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <Clock size={10} />
                          {days}d active{overDays > 0 ? ` · ${overDays}d past target` : ''}
                        </p>
                      </div>
                    </div>
                  )
                }

                if (status === 'on-track') {
                  const isNew = days <= 2
                  return (
                    <div
                      key={e.id}
                      onClick={() => navigate(`/employees/${e.id}`)}
                      className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={e.name} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-gray-900">{e.name}</p>
                            {isNew && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                                <Zap size={9} /> New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{e.role} · {progress?.program?.name}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                      </div>
                      {currentStage && (
                        <p className="text-xs text-gray-500 mb-2 truncate">
                          <span className="font-medium text-gray-700">Stage:</span> {currentStage.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <Bar pct={progress?.pct} variant="default" />
                        <span className="text-xs font-bold text-brand-600 tabular-nums shrink-0">{progress?.pct}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">{progress?.done}/{progress?.total} materials done</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {days === 0 ? 'Started today' : `${days}d active`}
                        </p>
                      </div>
                    </div>
                  )
                }

                return null
              })}

              {teamCards.length === 0 && (
                <div className="card p-8 text-center">
                  <p className="text-sm text-gray-400">No active onboardings. Add employees to see progress here.</p>
                </div>
              )}

              <button
                onClick={() => navigate('/employees/new')}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors font-medium"
              >
                + Add Employee
              </button>
            </div>
          </div>

          {/* ── Right: Health + Programs (2 cols) ──────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Health card */}
            {withProgram.length > 0 && (
              <div className="card p-5">
                <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Onboarding Health
                </h2>
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Team avg. progress</span>
                    <span className="text-xl font-bold text-gray-900 tabular-nums">{avgTeamPct}%</span>
                  </div>
                  <Bar
                    pct={avgTeamPct}
                    variant={byStatus.atRisk.length > 0 ? 'at-risk' : avgTeamPct >= 70 ? 'completed' : 'default'}
                  />
                </div>
                <div className="grid grid-cols-3 text-center divide-x divide-gray-100">
                  {[
                    { label: 'On Track', value: byStatus.onTrack.length, color: 'text-brand-700' },
                    { label: 'Completed', value: byStatus.completed.length, color: 'text-green-600' },
                    { label: 'At Risk', value: byStatus.atRisk.length, color: byStatus.atRisk.length > 0 ? 'text-amber-600' : 'text-gray-300' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/performance')}
                    className="w-full text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-1"
                  >
                    Full performance report <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Programs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Programs</h2>
                <button
                  onClick={() => navigate('/programs')}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>

              {programs.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-xs text-gray-400 mb-3">No programs yet</p>
                  <button onClick={() => setShowNewProgram(true)} className="btn-primary text-xs w-full">
                    <Plus size={13} className="mr-1" /> Create Program
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {programCards.map(prog => (
                    <div
                      key={prog.id}
                      onClick={() => navigate(`/programs/${prog.id}`)}
                      className={`card p-4 cursor-pointer hover:shadow-md transition-shadow ${prog.hasRisk ? 'border-l-4 border-l-amber-400' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{prog.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${prog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {prog.status}
                            </span>
                            {prog.estimatedDays && (
                              <span className="text-[10px] text-gray-400">{prog.estimatedDays}d</span>
                            )}
                          </div>
                        </div>
                        {prog.hasRisk && <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />}
                      </div>

                      {prog.enrolled.length > 0 ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex -space-x-1.5">
                              {prog.enrolled.slice(0, 5).map(emp => (
                                <div
                                  key={emp.id}
                                  className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                                  style={{ backgroundColor: avatarBg(emp.name) }}
                                  title={emp.name}
                                >
                                  {getInitials(emp.name)}
                                </div>
                              ))}
                              {prog.enrolled.length > 5 && (
                                <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                  +{prog.enrolled.length - 5}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {prog.enrolled.length} enrolled
                              {prog.doneCount > 0 && (
                                <span className="text-green-600 font-medium"> · {prog.doneCount} done</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Bar
                              pct={prog.avgPct}
                              variant={prog.hasRisk ? 'at-risk' : prog.avgPct >= 70 ? 'completed' : 'default'}
                            />
                            <span className="text-xs text-gray-500 tabular-nums shrink-0">{prog.avgPct}% avg</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400 italic">No employees assigned</p>
                          <button
                            onClick={evt => { evt.stopPropagation(); navigate('/employees') }}
                            className="text-xs text-brand-600 font-medium hover:text-brand-700"
                          >
                            Assign →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => setShowNewProgram(true)}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors font-medium"
                  >
                    + New Program
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <NewProgramModal open={showNewProgram} onClose={() => setShowNewProgram(false)} />
    </div>
  )
}
