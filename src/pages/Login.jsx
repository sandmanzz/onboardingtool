import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LayoutDashboard, ChevronDown, ChevronRight, Zap } from 'lucide-react'
import useStore, { DEMO_ACCOUNTS } from '../store/useStore'

export default function Login() {
  const { login, loginAs } = useStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    const result = login(form.email, form.password)
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    navigate(result.user?.role === 'owner' ? '/owner' : '/dashboard')
  }

  const handleDemo = (accountId) => {
    loginAs(accountId)
    navigate('/dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoMark}>
            <LayoutDashboard size={18} color="#fff" />
          </div>
          <span style={styles.logoText}>Onboard</span>
        </div>

        <div style={styles.heading}>
          <h1 style={styles.h1}>Welcome back</h1>
          <p style={styles.sub}>Sign in to continue to your workspace.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Work email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Password</label>
              <button type="button" style={styles.forgotBtn} tabIndex={-1}>Forgot password?</button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input"
                style={{ ...styles.input, paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={styles.divider}><span style={styles.dividerText}>or</span></div>

        <button type="button" style={styles.demoToggle} onClick={() => setShowDemo((v) => !v)}>
          <Zap size={14} />
          Try a demo account
          {showDemo ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
        </button>

        {showDemo && (
          <div style={styles.demoList}>
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.id} onClick={() => handleDemo(account.id)} style={styles.demoItem}>
                <div style={{ ...styles.demoAvatar, backgroundColor: account.company.primaryColor }}>
                  {account.label.charAt(0)}
                </div>
                <div style={styles.demoInfo}>
                  <span style={styles.demoName}>{account.label}</span>
                  <span style={styles.demoSub}>{account.subtitle}</span>
                </div>
                <span style={account.badge === 'Sample Data' ? styles.badgeFilled : styles.badgeEmpty}>
                  {account.badge}
                </span>
              </button>
            ))}
            <p style={styles.demoHint}>
              Owner panel: <code style={styles.code}>admin@onboard.app</code> / <code style={styles.code}>admin123</code>
            </p>
          </div>
        )}

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Create one free</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#eef0fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 4px 40px rgba(79,95,255,0.10), 0 1px 4px rgba(0,0,0,0.06)',
    padding: '40px 40px 36px',
    borderLeft: '4px solid #4f5fff',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' },
  logoMark: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: '#4f5fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: '17px', fontWeight: '700', color: '#111827', letterSpacing: '-0.01em' },
  heading: { marginBottom: '28px' },
  h1: { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' },
  sub: { fontSize: '14px', color: '#6b7280', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', fontSize: '13px', padding: '10px 14px',
    borderRadius: '10px', lineHeight: '1.5',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  labelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  forgotBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '12px', color: '#4f5fff', padding: 0,
  },
  input: { width: '100%' },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
    padding: '4px', display: 'flex', alignItems: 'center',
  },
  submitBtn: { width: '100%', justifyContent: 'center', height: '44px', fontSize: '15px', marginTop: '4px' },
  divider: {
    display: 'flex', alignItems: 'center', gap: '12px',
    margin: '20px 0 12px', color: '#9ca3af', fontSize: '12px',
  },
  dividerText: { color: '#9ca3af', padding: '0 4px' },
  demoToggle: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', borderRadius: '10px', border: '1.5px dashed #c7d2fe',
    background: '#f5f7ff', color: '#4338ca', fontSize: '13px', fontWeight: '500',
    cursor: 'pointer', transition: 'all 0.15s',
  },
  demoList: { marginTop: '8px', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' },
  demoItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 14px', background: 'none', border: 'none',
    borderBottom: '1px solid #f3f4f6', cursor: 'pointer', textAlign: 'left',
  },
  demoAvatar: {
    width: '34px', height: '34px', borderRadius: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0,
  },
  demoInfo: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  demoName: { fontSize: '13px', fontWeight: '600', color: '#111827' },
  demoSub: { fontSize: '11px', color: '#9ca3af', marginTop: '1px' },
  badgeFilled: {
    fontSize: '11px', fontWeight: '500', padding: '3px 8px',
    borderRadius: '20px', background: '#e0e7ff', color: '#4338ca', flexShrink: 0,
  },
  badgeEmpty: {
    fontSize: '11px', fontWeight: '500', padding: '3px 8px',
    borderRadius: '20px', background: '#f3f4f6', color: '#6b7280', flexShrink: 0,
  },
  demoHint: {
    padding: '10px 14px', fontSize: '11px', color: '#9ca3af',
    background: '#fafafa', borderTop: '1px solid #f3f4f6', margin: 0, lineHeight: '1.8',
  },
  code: {
    background: '#e5e7eb', color: '#374151', padding: '1px 5px',
    borderRadius: '4px', fontFamily: 'monospace', fontSize: '10.5px',
  },
  footer: { textAlign: 'center', fontSize: '13px', color: '#6b7280', margin: '20px 0 0' },
  link: { color: '#4f5fff', fontWeight: '500', textDecoration: 'none' },
}
