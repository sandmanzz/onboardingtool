import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Check } from 'lucide-react'
import useStore from '../store/useStore'

const CSS = `
  .r-input {
    width: 100%; height: 44px; padding: 0 13px;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 14px; color: #0f172a; background: #f8fafc;
    outline: none; font-family: inherit;
    transition: border-color .15s, box-shadow .15s, background .15s;
  }
  .r-input::placeholder { color: #94a3b8; }
  .r-input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .r-input.err { border-color: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.1); }
  .r-btn {
    width: 100%; height: 48px;
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
    color: #fff; font-size: 15px; font-weight: 600;
    border: none; border-radius: 11px; cursor: pointer;
    font-family: inherit; letter-spacing: -0.01em;
    transition: transform .15s, box-shadow .15s, opacity .15s;
  }
  .r-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 32px rgba(79,70,229,0.38); }
  .r-btn:active:not(:disabled) { transform: none; box-shadow: none; }
  .r-btn:disabled { opacity: .55; cursor: not-allowed; }
  .r-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #94a3b8;
    padding: 4px; display: flex; align-items: center; transition: color .1s;
  }
  .r-eye:hover { color: #64748b; }
`

function pwStrength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const S_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong']
const S_COLOR = ['', '#ef4444', '#f59e0b', '#10b981', '#10b981']

const STEPS = [
  { n: '01', title: 'Create your account', sub: 'Name, email, and company in seconds.' },
  { n: '02', title: 'Build your first program', sub: 'Add stages, materials, and role assignments.' },
  { n: '03', title: 'Invite your team', sub: 'Employees get a guided onboarding link.' },
]

const Logo = ({ size = 34 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.29,
    background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(79,70,229,0.5)', flexShrink: 0,
  }}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/>
    </svg>
  </div>
)

export default function Register() {
  const { register } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', companyName: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = pwStrength(form.password)
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.companyName || !form.password) { setError('Please fill in all required fields.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const res = await register({ name: form.name, email: form.email, password: form.password, companyName: form.companyName })
    setLoading(false)
    if (!res.success) { setError(res.error); return }
    navigate('/dashboard')
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* LEFT PANEL */}
        <div
          className="hidden lg:flex"
          style={{
            width: '42%', flexShrink: 0, background: '#060B18',
            position: 'relative', overflow: 'hidden',
            flexDirection: 'column', padding: '40px 48px',
          }}
        >
          {/* Textures */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
          <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '70%', height: '60%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.24) 0%, transparent 68%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '55%', height: '45%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Logo size={34} />
              <span style={{ fontSize: '17px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>Onboard</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '40px' }}>
              {/* Headline */}
              <div>
                <h1 style={{ fontSize: '34px', fontWeight: '800', color: '#fff', lineHeight: '1.15', letterSpacing: '-0.035em', margin: '0 0 14px' }}>
                  Get your team<br />
                  <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    up to speed.
                  </span>
                </h1>
                <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.44)', lineHeight: '1.65', margin: 0, maxWidth: '300px' }}>
                  Free forever. No credit card required. Set up in under 5 minutes.
                </p>
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {STEPS.map((step, i) => (
                  <div key={step.n} style={{ display: 'flex', gap: '16px' }}>
                    {/* Line + dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', flexShrink: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.32)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '700', color: '#818cf8', letterSpacing: '0.02em',
                      }}>{step.n}</div>
                      {i < STEPS.length - 1 && (
                        <div style={{ width: '1px', height: '28px', background: 'rgba(99,102,241,0.2)', margin: '4px 0' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < STEPS.length - 1 ? '0' : '0', paddingTop: '6px', paddingBottom: i < STEPS.length - 1 ? '28px' : '0' }}>
                      <p style={{ margin: '0 0 3px', fontSize: '13.5px', fontWeight: '600', color: 'rgba(255,255,255,0.82)' }}>{step.title}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.5' }}>{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust strip */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px', padding: '18px 20px',
              }}>
                <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
                  Trusted by teams at
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Stride Tech', 'Meridian Health', 'Kite Logistics', 'Nova Digital', 'Bloom Studio'].map((co) => (
                    <span key={co} style={{
                      fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.42)',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                      padding: '4px 11px', borderRadius: '20px',
                    }}>{co}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom note */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '20px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6' }}>
                By creating an account you agree to our{' '}
                <span style={{ color: 'rgba(129,140,248,0.7)', cursor: 'pointer' }}>Terms of Service</span>{' '}
                and{' '}
                <span style={{ color: 'rgba(129,140,248,0.7)', cursor: 'pointer' }}>Privacy Policy</span>.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '32px 24px', minHeight: '100vh' }}>
          <div style={{ width: '100%', maxWidth: '440px' }}>

            {/* Mobile logo */}
            <div className="flex lg:hidden" style={{ alignItems: 'center', gap: '9px', marginBottom: '32px' }}>
              <Logo size={32} />
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em' }}>Onboard</span>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 7px', letterSpacing: '-0.03em' }}>Create your account</h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Start onboarding your team in minutes — free forever.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', padding: '11px 14px', borderRadius: '10px', lineHeight: '1.5' }}>
                  {error}
                </div>
              )}

              {/* Name + Company row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Full name <span style={{ color: '#f87171' }}>*</span></label>
                  <input type="text" autoComplete="name" placeholder="Alex Morgan" value={form.name} onChange={upd('name')} className="r-input" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Company <span style={{ color: '#f87171' }}>*</span></label>
                  <input type="text" placeholder="Acme Inc." value={form.companyName} onChange={upd('companyName')} className="r-input" />
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Work email <span style={{ color: '#f87171' }}>*</span></label>
                <input type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={upd('email')} className="r-input" />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Password <span style={{ color: '#f87171' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={upd('password')} className="r-input" style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="r-eye" tabIndex={-1}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
                      {[1,2,3,4].map((i) => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i <= strength ? S_COLOR[strength] : '#e2e8f0', transition: 'background .2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: S_COLOR[strength], minWidth: '36px', textAlign: 'right' }}>{S_LABEL[strength]}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Confirm password <span style={{ color: '#f87171' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type="password" autoComplete="new-password" placeholder="••••••••" value={form.confirm} onChange={upd('confirm')} className="r-input" style={{ paddingRight: '44px' }} />
                  {form.confirm.length > 0 && form.password === form.confirm && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                      <Check size={15} color="#10b981" />
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="r-btn" disabled={loading} style={{ marginTop: '6px' }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>

              <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '0', lineHeight: '1.6' }}>
                By signing up you agree to our{' '}
                <span style={{ color: '#6366f1', cursor: 'pointer' }}>Terms</span>
                {' and '}
                <span style={{ color: '#6366f1', cursor: 'pointer' }}>Privacy Policy</span>.
              </p>
            </form>

            <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#64748b', margin: '24px 0 0' }}>
              Already have an account?{' '}
              <Link to="/" style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
