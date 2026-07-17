import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, DollarSign, Activity, LogOut,
  TrendingUp, Search, ChevronDown, Building2, CheckCircle2, Clock, XCircle
} from 'lucide-react'
import useStore, { ALL_ACCOUNTS } from '../store/useStore'

const PLAN_COLORS = {
  Free: { bg: '#f3f4f6', text: '#6b7280' },
  Pro:  { bg: '#e0e7ff', text: '#4338ca' },
  Team: { bg: '#d1fae5', text: '#065f46' },
}
const STATUS_CONFIG = {
  active: { icon: CheckCircle2, color: '#10b981', label: 'Active' },
  trial:  { icon: Clock,        color: '#f59e0b', label: 'Trial'  },
  churned:{ icon: XCircle,      color: '#ef4444', label: 'Churned'},
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, background: color + '22' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={s.statValue}>{value}</p>
        <p style={s.statLabel}>{label}</p>
        {sub && <p style={s.statSub}>{sub}</p>}
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

  const totalMRR = ALL_ACCOUNTS.reduce((sum, a) => sum + a.mrr, 0)
  const totalEmps = ALL_ACCOUNTS.reduce((sum, a) => sum + a.employees, 0)
  const activeCount = ALL_ACCOUNTS.filter((a) => a.status === 'active').length
  const trialCount  = ALL_ACCOUNTS.filter((a) => a.status === 'trial').length

  const plans = ['All', 'Free', 'Pro', 'Team']

  const filtered = ALL_ACCOUNTS.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q)
    const matchPlan   = planFilter === 'All' || a.plan === planFilter
    return matchSearch && matchPlan
  })

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <div style={s.logoMark}><LayoutDashboard size={16} color="#fff" /></div>
          <span style={s.logoText}>Onboard</span>
          <span style={s.ownerBadge}>Owner</span>
        </div>

        <nav style={s.nav}>
          <button style={{ ...s.navItem, ...s.navActive }}>
            <Building2 size={16} /> Accounts
          </button>
          <button style={s.navItem}>
            <TrendingUp size={16} /> Revenue
          </button>
          <button style={s.navItem}>
            <Users size={16} /> Users
          </button>
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.userRow}>
            <div style={s.userAvatar}>
              {currentUser?.name?.charAt(0) ?? 'O'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.userName}>{currentUser?.name ?? 'Owner'}</p>
              <p style={s.userEmail}>{currentUser?.email ?? ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={s.logoutBtn}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topBar}>
          <div>
            <h1 style={s.pageTitle}>Account Overview</h1>
            <p style={s.pageSub}>All active and trial workspaces</p>
          </div>
          <div style={s.topBarRight}>
            <span style={s.dateBadge}>
              <Activity size={12} /> Live
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          <StatCard icon={Building2}   label="Total accounts" value={ALL_ACCOUNTS.length} color="#4f5fff" />
          <StatCard icon={DollarSign}  label="Monthly revenue" value={`$${totalMRR}`} sub={`${activeCount} paying`} color="#10b981" />
          <StatCard icon={Users}       label="Total employees" value={totalEmps} color="#8b5cf6" />
          <StatCard icon={Clock}       label="Trials" value={trialCount} sub="Awaiting conversion" color="#f59e0b" />
        </div>

        {/* Filters */}
        <div style={s.filterRow}>
          <div style={s.searchWrap}>
            <Search size={15} color="#9ca3af" style={{ flexShrink: 0 }} />
            <input
              placeholder="Search accounts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={s.searchInput}
            />
          </div>
          <div style={s.planTabs}>
            {plans.map((p) => (
              <button
                key={p}
                onClick={() => setPlanFilter(p)}
                style={{ ...s.planTab, ...(planFilter === p ? s.planTabActive : {}) }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Account', 'Plan', 'Status', 'Employees', 'Programs', 'MRR', 'Joined'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => {
                const planStyle = PLAN_COLORS[account.plan] || PLAN_COLORS.Free
                const statusCfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.active
                const StatusIcon = statusCfg.icon
                return (
                  <tr key={account.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.accountCell}>
                        <div style={s.accountAvatar}>
                          {account.name.charAt(0)}
                        </div>
                        <div>
                          <p style={s.accountName}>{account.name}</p>
                          <p style={s.accountOwner}>{account.owner}</p>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.planBadge, background: planStyle.bg, color: planStyle.text }}>
                        {account.plan}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, color: statusCfg.color }}>
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={{ ...s.td, ...s.numCell }}>{account.employees}</td>
                    <td style={{ ...s.td, ...s.numCell }}>{account.programs}</td>
                    <td style={{ ...s.td, ...s.numCell }}>
                      {account.mrr > 0 ? <span style={s.mrr}>${account.mrr}</span> : <span style={s.mrrZero}>—</span>}
                    </td>
                    <td style={{ ...s.td, ...s.dateTd }}>
                      {new Date(account.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={s.emptyState}>
              <Building2 size={28} color="#d1d5db" />
              <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>No accounts match your filter.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const SIDEBAR_W = '220px'
const s = {
  shell: { display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },

  sidebar: {
    width: SIDEBAR_W, flexShrink: 0, background: '#0f172a',
    display: 'flex', flexDirection: 'column', padding: '0',
    position: 'sticky', top: 0, height: '100vh',
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '20px 18px 16px', borderBottom: '1px solid #1e293b',
  },
  logoMark: {
    width: '28px', height: '28px', borderRadius: '8px',
    background: '#4f5fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { fontSize: '15px', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.01em' },
  ownerBadge: {
    fontSize: '9px', fontWeight: '700', letterSpacing: '0.06em',
    background: '#4f5fff33', color: '#818cf8', padding: '2px 6px',
    borderRadius: '20px', textTransform: 'uppercase', marginLeft: 'auto',
  },
  nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' },
  navItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 10px', borderRadius: '8px', border: 'none',
    background: 'transparent', color: '#94a3b8', fontSize: '13px',
    fontWeight: '500', cursor: 'pointer', textAlign: 'left',
  },
  navActive: { background: '#1e293b', color: '#f8fafc' },
  sidebarBottom: { padding: '12px 10px 16px', borderTop: '1px solid #1e293b' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 6px', marginBottom: '6px' },
  userAvatar: {
    width: '30px', height: '30px', borderRadius: '8px',
    background: '#4f5fff', color: '#fff', fontWeight: '700', fontSize: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userName: { fontSize: '12px', fontWeight: '600', color: '#f1f5f9', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: '10px', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 10px', borderRadius: '8px', border: 'none',
    background: 'transparent', color: '#64748b', fontSize: '12px',
    fontWeight: '500', cursor: 'pointer',
  },

  main: { flex: 1, padding: '32px 36px', minWidth: 0, overflowX: 'auto' },
  topBar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' },
  pageSub: { fontSize: '14px', color: '#64748b', margin: 0 },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  dateBadge: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', fontWeight: '600', color: '#10b981',
    background: '#d1fae5', padding: '4px 10px', borderRadius: '20px',
  },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' },
  statCard: {
    background: '#fff', borderRadius: '14px', padding: '20px',
    display: 'flex', alignItems: 'center', gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  statIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px' },
  statLabel: { fontSize: '12px', color: '#64748b', margin: 0 },
  statSub: { fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' },

  filterRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
    padding: '8px 12px', flex: 1, minWidth: '200px',
  },
  searchInput: { border: 'none', outline: 'none', fontSize: '13px', color: '#0f172a', width: '100%', background: 'transparent' },
  planTabs: { display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '3px' },
  planTab: {
    padding: '5px 12px', borderRadius: '7px', border: 'none', background: 'transparent',
    fontSize: '12px', fontWeight: '500', color: '#64748b', cursor: 'pointer',
  },
  planTabActive: { background: '#fff', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },

  tableWrap: {
    background: '#fff', borderRadius: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 16px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em',
    color: '#94a3b8', textAlign: 'left', background: '#f8fafc',
    borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase',
  },
  tr: { borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' },
  td: { padding: '14px 16px', fontSize: '13px', color: '#334155', verticalAlign: 'middle' },

  accountCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  accountAvatar: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #4f5fff, #818cf8)',
    color: '#fff', fontWeight: '700', fontSize: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  accountName: { fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: 0 },
  accountOwner: { fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' },

  planBadge: { fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500' },

  numCell: { textAlign: 'center', fontVariantNumeric: 'tabular-nums' },
  mrr: { fontWeight: '600', color: '#10b981' },
  mrrZero: { color: '#cbd5e1' },
  dateTd: { color: '#94a3b8', fontSize: '12px' },

  emptyState: {
    padding: '48px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
}
