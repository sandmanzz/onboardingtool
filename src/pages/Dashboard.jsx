import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Users, Plus, ArrowRight, Clock,
  CheckCircle2, FileText, UserCheck, AlertCircle
} from 'lucide-react'
import useStore from '../store/useStore'

const AVATAR_COLORS = ['#4f5fff','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16']
function avatarColor(name) {
  let hash = 0
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function getProgress(employee, programs) {
  if (!employee.assignedProgramId) return null
  const program = programs.find((p) => p.id === employee.assignedProgramId)
  if (!program) return null
  const allMaterials = program.stages.flatMap((s) => s.materials)
  const total = allMaterials.length
  if (total === 0) return { percent: 0, program }
  const done = allMaterials.filter((m) => employee.completedMaterials.includes(m.id)).length
  return { percent: Math.round((done / total) * 100), program }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { company, programs, employees } = useStore()

  const totalMaterials = programs.reduce(
    (acc, p) => acc + p.stages.reduce((a, s) => a + s.materials.length, 0),
    0
  )
  const published = programs.filter((p) => p.status === 'published').length
  const assignedCount = employees.filter((e) => e.assignedProgramId).length
  const completedCount = employees.filter((e) => {
    const prog = getProgress(e, programs)
    return prog?.percent === 100
  }).length

  // Employees needing assignment
  const unassigned = employees.filter((e) => !e.assignedProgramId)

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{company?.name ? `, ${company.name}` : ''}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Here's an overview of your onboarding activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Programs" value={programs.length} color="text-brand-600" bg="bg-brand-100" />
        <StatCard icon={CheckCircle2} label="Published" value={published} color="text-green-600" bg="bg-green-100" />
        <StatCard icon={Users} label="Employees" value={employees.length} color="text-purple-600" bg="bg-purple-100" />
        <StatCard icon={UserCheck} label="Onboarding" value={assignedCount} color="text-amber-600" bg="bg-amber-100" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Programs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Programs</h2>
            <button
              onClick={() => navigate('/programs')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {programs.length === 0 ? (
            <div className="card p-10 text-center">
              <BookOpen size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">No programs yet</p>
              <button onClick={() => navigate('/programs/new')} className="btn-primary text-sm">
                <Plus size={14} className="mr-1.5" /> Create Program
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.slice(0, 4).map((program) => {
                const stageCount = program.stages.length
                const matCount = program.stages.reduce((a, s) => a + s.materials.length, 0)
                const assignedTo = employees.filter((e) => e.assignedProgramId === program.id).length
                return (
                  <div
                    key={program.id}
                    onClick={() => navigate(`/programs/${program.id}`)}
                    className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900">{program.name}</span>
                          <span className={`badge shrink-0 ${program.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {program.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {stageCount} stages · {matCount} materials · {assignedTo} employee{assignedTo !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 shrink-0 mt-0.5" />
                    </div>
                  </div>
                )
              })}
              <button
                onClick={() => navigate('/programs/new')}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-brand-200 hover:text-brand-500 transition-colors font-medium"
              >
                + New Program
              </button>
            </div>
          )}
        </div>

        {/* Employees needing attention */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Employees</h2>
            <button
              onClick={() => navigate('/employees')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {employees.length === 0 ? (
            <div className="card p-10 text-center">
              <Users size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">No employees added</p>
              <button onClick={() => navigate('/employees/new')} className="btn-primary text-sm">
                <Plus size={14} className="mr-1.5" /> Add Employee
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {unassigned.length > 0 && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-800">
                      {unassigned.length} employee{unassigned.length > 1 ? 's' : ''} not yet assigned
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {unassigned.map((e) => e.name).join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/employees')}
                    className="text-xs text-amber-700 font-medium hover:text-amber-900 shrink-0"
                  >
                    Assign
                  </button>
                </div>
              )}

              {employees.slice(0, 4).map((emp) => {
                const progress = getProgress(emp, programs)
                return (
                  <div
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="card p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: avatarColor(emp.name) }}
                      >
                        {getInitials(emp.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                        {progress ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progress.percent === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{progress.percent}%</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic mt-0.5">No program assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              <button
                onClick={() => navigate('/employees/new')}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-brand-200 hover:text-brand-500 transition-colors font-medium"
              >
                + Add Employee
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Insight banner — only when no programs */}
      {programs.length === 0 && (
        <div className="mt-8 p-5 rounded-xl bg-brand-50 border border-brand-100">
          <h3 className="text-sm font-semibold text-brand-800 mb-2">Why structured onboarding matters</h3>
          <ul className="space-y-1.5 text-sm text-brand-700">
            <li>• Only 12% of employees feel their company excels at onboarding (Gallup)</li>
            <li>• 70% of new hires decide "job fit" within the first month</li>
            <li>• Structured onboarding can reduce early turnover by up to 50%</li>
          </ul>
        </div>
      )}
    </div>
  )
}
