import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, LayoutDashboard, Check } from 'lucide-react'
import useStore from '../store/useStore'

function passwordStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score // 0-4
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981', '#10b981']

export default function Register() {
  const { register } = useStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', companyName: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = passwordStrength(form.password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.companyName || !form.password) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const result = register({ name: form.name, email: form.email, password: form.password, companyName: form.companyName })
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    navigate('/dashboard')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoMark}><LayoutDashboard size={18} color="#fff" /></div>
          <span style={styles.logoText}>Onboard</span>
        </div>

        <div style={styles.heading}>
          <h1 style={styles.h1}>Create your account</h1>
          <p style={styles.sub}>Start onboarding your team in minutes — free forever.</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Full name <span style={styles.req}>*</span></label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Company name <span style={styles.req}>*</span></label>
              <input
                type="text"
                placeholder="Acme Inc."
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Work email <span style={styles.req}>*</span></label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password <span style={styles.req}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input"
                style={{ paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={styles.eyeBtn} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password.length > 0 && (
              <div style={styles.strengthRow}>
                <div style={styles.strengthBars}>
                  {[1,2,3,4].map((i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.strengthBar,
                        background: i <= strength ? strengthColor[strength] : '#e5e7eb',
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: strengthColor[strength], fontWeight: '500' }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm password <span style={styles.req}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                className="input"
                style={{ paddingRight: '44px' }}
              />
              {form.confirm.length > 0 && form.password === form.confirm && (
                <div style={styles.checkIcon}><Check size={14} color="#10b981" /></div>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p style={styles.terms}>
            By signing up, you agree to our{' '}
            <a href="#" style={styles.termLink} onClick={(e) => e.preventDefault()}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={styles.termLink} onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </p>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/" style={styles.link}>Sign in</Link>
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
    maxWidth: '480px',
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 4px 40px rgba(79,95,255,0.10), 0 1px 4px rgba(0,0,0,0.06)',
    padding: '40px 40px 36px',
    borderLeft: '4px solid #4f5fff',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' },
  logoMark: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: '#4f5fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: '17px', fontWeight: '700', color: '#111827', letterSpacing: '-0.01em' },
  heading: { marginBottom: '24px' },
  h1: { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' },
  sub: { fontSize: '14px', color: '#6b7280', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#b91c1c', fontSize: '13px', padding: '10px 14px',
    borderRadius: '10px', lineHeight: '1.5',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  req: { color: '#ef4444', marginLeft: '2px' },
  eyeBtn: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
    padding: '4px', display: 'flex', alignItems: 'center',
  },
  checkIcon: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    display: 'flex', alignItems: 'center',
  },
  strengthRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' },
  strengthBars: { display: 'flex', gap: '4px', flex: 1 },
  strengthBar: { height: '3px', flex: 1, borderRadius: '99px', transition: 'background 0.2s' },
  submitBtn: { width: '100%', justifyContent: 'center', height: '44px', fontSize: '15px', marginTop: '4px' },
  terms: { fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: 0, lineHeight: '1.6' },
  termLink: { color: '#4f5fff', textDecoration: 'none' },
  footer: { textAlign: 'center', fontSize: '13px', color: '#6b7280', margin: '20px 0 0' },
  link: { color: '#4f5fff', fontWeight: '500', textDecoration: 'none' },
}
