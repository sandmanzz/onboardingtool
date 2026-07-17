import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, DollarSign, Activity, LogOut,
  TrendingUp, Search, CheckCircle2, Clock, XCircle, ArrowUpRight,
} from 'lucide-react'
import useStore, { ALL_ACCOUNTS } from '../store/useStore'

const CSS = `
  .owner-search {
    border: none; outline: none; background: transparent;
    font-size: 13px; color: #0f172a; font-family: inherit; width: 100%;
  }
  .owner-search::placeholder { color: #94a3b8; }
  .owner-nav-btn {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 9px 11px; border-radius: 9px; border: none;
    background: transparent; color: #64748b; font-size: 13px;
    font-weight: 500; cursor: pointer; text-align: left;
    font-family: inherit; transition: background .1s, color .1s;
  }
  .owner-nav-btn:hover { background: rgba(255,255,255,0.06); color: #cbd5e1; }
  .owner-nav-btn.active { background: rgba(99,102,241,0.18); color: #a5b4fc; }
  .owner-tr { border-bottom: 1px solid #f8fafc; transition: background .1s; }
  .owner-tr:hover { background: #fafbff; }
  .owner-tr:last-child { border-bottom: none; }
  .plan-tab { padding: 5px 13px; border-radius: 7px; border: none; background: transparent; font-size: 12px; font-weight: 500; color: #64748b; cursor: pointer; font-family: inherit; transition: background .1s, color .1s; }
  .plan-tab:hover { background: #fff; }
  .plan-tab.active { background: #fff; color: #0f172a; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .logout-btn {
    width: 100%; display: flex; align-items: center; gap: 8px;
    padding: 9px 11px; border-radius: 9px; border: none; background: transparent;
    color: #475569; font-size: 12px; font-weight: 500; cursor: pointer;
    font-family: inherit; transition: background .1s, color .1s;
  }
  .logout-btn:hover { background: rgba(255,255,255,0.05); color: #94a3b8; }
`

const PLAN_STYLE = {
  Free: { bg: '#f1f5f9', color: '#64748b' },
  Pro:  { bg: '#eef2ff', color: '#4338ca' },
  Team: { bg: '#ecfdf5', color: '#065f46' },
}
const STATUS_CFG = {
  active:  { icon: CheckCircle2, color: '#10b981', label: 'Active' },
  trial:   { icon: Clock,        color: '#f59e0b', label: 'Trial'  },
  churned: { icon: XCircle,      color: '#ef4444', label: 'Churned'},
}

const Logo = () => (
  <div style={{
    width: '30px', height: '30px', borderRadius: '9px',
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 3px 10px rgba(79,70,229,0.45)',
  }}>
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/>
    </svg>
  </div>
)

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '22px 22px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 0 rgba(0,0,0,0.03)',
      border: '1px solid #f1f5f9',
      display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '11px',
          background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={19} color={color} />
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: '600', color: '#10b981', background: '#ecfdf5', padding: '3px 8px', borderRadius: '20px' }}>
            <ArrowUpRight size={11} /> {trend}
          </div>
        )}
      </div>
      <div>
        <p style={{ margin: '0 0 3px', fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>{label}</p>
        {sub && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  const { logout, currentUser } = useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('All')

  const handleLogout = () => { logout(); navigate('/') }

  const totalMRR    = ALL_ACCOUNTS.reduce((s, a) => s + a.mrr, 0)
  const totalEmps   = ALL_ACCOUNTS.reduce((s, a) => s + a.employees, 0)
  const activeCount = ALL_ACCOUNTS.filter((a) => a.status === 'active').length
  const trialCount  = ALL_ACCOUNTS.filter((a) => a.status === 'trial').length

  const filtered = ALL_ACCOUNTS.filter((a) => {
    const q = search.toLowerCase()
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q)
    const matchP = planFilter === 'All' || a.plan === planFilter
    return matchQ && matchP
  })

  const navItems = [
    { icon: Building2, label: 'Accounts', active: true },
    { icon: TrendingUp, label: 'Revenue' },
    { icon: Users, label: 'Users' },
    { icon: Activity, label: 'Activity' },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* SIDEBAR */}
        <aside style={{
          width: '224px', flexShrink: 0,
          background: '#0a0f1e',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* Logo + wordmark */}
          <div style={{ padding: '22px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
              <Logo />
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em' }}>Onboard</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', color: '#4ade80', textTransform: 'uppercase' }}>Owner Console</span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map(({ icon: Icon, label, active }) => (
              <button key={label} className={`owner-nav-btn${active ? ' active' : ''}`}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>

          {/* User section */}
          <div style={{ padding: '10px 8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 11px', marginBottom: '4px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '9px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: '800', color: '#fff', flexShrink: 0,
              }}>
                {currentUser?.name?.charAt(0) ?? 'O'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.name ?? 'Owner'}
                </p>
                <p style={{ margin: 0, fontSize: '10.5px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.email ?? ''}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, padding: '36px 40px', minWidth: 0, overflowX: 'auto' }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8' }}>Overview</p>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>Account Management</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '20px', padding: '5px 12px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#065f46' }}>Live</span>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            <StatCard icon={Building2}  label="Total accounts"  value={ALL_ACCOUNTS.length} color="#6366f1" trend="+2 this month" />
            <StatCard icon={DollarSign} label="Monthly revenue" value={`$${totalMRR}`} sub={`${activeCount} paying accounts`} color="#10b981" trend="+12%" />
            <StatCard icon={Users}      label="Total employees" value={totalEmps} color="#8b5cf6" />
            <StatCard icon={Clock}      label="Active trials"   value={trialCount} sub="Awaiting conversion" color="#f59e0b" />
          </div>

          {/* Filters row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '11px',
              padding: '9px 14px', flex: 1, minWidth: '200px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input className="owner-search" placeholder="Search by name or owner email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '3px', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
              {['All', 'Free', 'Pro', 'Team'].map((p) => (
                <button key={p} onClick={() => setPlanFilter(p)} className={`plan-tab${planFilter === p ? ' active' : ''}`}>{p}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: '#fff', borderRadius: '16px', overflow: 'hidden',
            border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['Account', 'Plan', 'Status', 'Employees', 'Programs', 'MRR', 'Joined'].map((h) => (
                    <th key={h} style={{
                      padding: '11px 18px', fontSize: '10.5px', fontWeight: '700',
                      letterSpacing: '0.07em', color: '#94a3b8', textAlign: 'left',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((acc) => {
                  const ps = PLAN_STYLE[acc.plan] || PLAN_STYLE.Free
                  const sc = STATUS_CFG[acc.status] || STATUS_CFG.active
                  const StatusIcon = sc.icon
                  return (
                    <tr key={acc.id} className="owner-tr">
                      {/* Account */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '800', color: '#fff', flexShrink: 0,
                          }}>{acc.name.charAt(0)}</div>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{acc.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>{acc.owner}</p>
                          </div>
                        </div>
                      </td>
                      {/* Plan */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '11.5px', fontWeight: '600', padding: '4px 10px',
                          borderRadius: '20px', background: ps.bg, color: ps.color,
                        }}>{acc.plan}</span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: '500', color: sc.color }}>
                          <StatusIcon size={13} /> {sc.label}
                        </span>
                      </td>
                      {/* Numbers */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{acc.employees}</td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: '#334155', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{acc.programs}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {acc.mrr > 0
                          ? <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>${acc.mrr}</span>
                          : <span style={{ fontSize: '13px', color: '#cbd5e1' }}>—</span>}
                      </td>
                      {/* Joined */}
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(acc.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{ padding: '56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <Building2 size={28} color="#e2e8f0" />
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>No accounts match your filter.</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Showing <strong style={{ color: '#64748b' }}>{filtered.length}</strong> of <strong style={{ color: '#64748b' }}>{ALL_ACCOUNTS.length}</strong> accounts
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>Last updated just now</p>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
