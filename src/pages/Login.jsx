import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import useStore, { DEMO_ACCOUNTS } from '../store/useStore'

const CSS = `
  .a-input {
    width: 100%; height: 46px; padding: 0 14px;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-size: 14px; color: #0f172a; background: #f8fafc;
    outline: none; font-family: inherit;
    transition: border-color .15s, box-shadow .15s, background .15s;
  }
  .a-input::placeholder { color: #94a3b8; }
  .a-input:focus {
    border-color: #6366f1; background: #fff;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .a-input.err { border-color: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.1); }
  .a-btn {
    width: 100%; height: 48px;
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
    color: #fff; font-size: 15px; font-weight: 600;
    border: none; border-radius: 11px; cursor: pointer;
    font-family: inherit; letter-spacing: -0.01em;
    transition: transform .15s, box-shadow .15s, opacity .15s;
    display: flex; align-items: center; justify-content: center;
  }
  .a-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 32px rgba(79,70,229,0.38);
  }
  .a-btn:active:not(:disabled) { transform: none; box-shadow: none; }
  .a-btn:disabled { opacity: .55; cursor: not-allowed; }
  .a-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #94a3b8;
    padding: 4px; display: flex; align-items: center; transition: color .1s;
  }
  .a-eye:hover { color: #64748b; }
  .demo-row {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; background: none; border: none;
    border-bottom: 1px solid #f1f5f9; cursor: pointer;
    text-align: left; font-family: inherit; transition: background .1s;
  }
  .demo-row:hover { background: #f8fafc; }
  .demo-row:last-of-type { border-bottom: none; }
`

function MockCard() {
  const rows = [
    { name: 'Sarah K.', pct: 100, color: '#22c55e' },
    { name: 'Mike R.',  pct: 72,  color: '#6366f1' },
    { name: 'Priya M.', pct: 34,  color: '#f59e0b' },
  ]
  return (
    <div style={{
      background: 'rgba(255,255,255,0.055)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px',
      padding: '22px 22px 18px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
            Engineering Onboarding
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>4 stages · 12 materials</p>
        </div>
        <span style={{
          background: 'rgba(34,197,94,0.15)', color: '#4ade80',
          fontSize: '10px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px',
          border: '1px solid rgba(74,222,128,0.2)', letterSpacing: '0.01em',
        }}>Published</span>
      </div>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Team progress</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8' }}>68%</span>
        </div>
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: '99px', boxShadow: '0 0 10px rgba(99,102,241,0.7)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        {rows.map((r) => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '7px',
              background: r.color + '20', border: `1px solid ${r.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: '800', color: r.color, flexShrink: 0,
            }}>{r.name.charAt(0)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>{r.name}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontVariantNumeric: 'tabular-nums' }}>{r.pct}%</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: '99px', opacity: r.pct === 100 ? 1 : 0.72 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURES = [
  'Build structured onboarding programs in minutes',
  "Track every new hire's progress in real-time",
  'Automate the first 90 days, from day one',
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

export default function Login() {
  const { login } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const doLogin = async (email, password) => {
    setError('')
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (!res.success) { setError(res.error); return }
    navigate(res.user?.role === 'owner' ? '/owner' : '/dashboard')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    doLogin(form.email, form.password)
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* LEFT PANEL */}
        <div
          className="hidden lg:flex"
          style={{
            width: '46%', flexShrink: 0, background: '#060B18',
            position: 'relative', overflow: 'hidden',
            flexDirection: 'column', padding: '40px 48px',
          }}
        >
          {/* Textures */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
          <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '75%', height: '65%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.28) 0%, transparent 68%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '5%', right: '-8%', width: '55%', height: '45%', background: 'radial-gradient(ellipse, rgba(79,70,229,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Logo size={34} />
              <span style={{ fontSize: '17px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' }}>Onboard</span>
            </div>

            {/* Hero copy */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  background: 'rgba(99,102,241,0.13)', border: '1px solid rgba(99,102,241,0.28)',
                  borderRadius: '20px', padding: '5px 13px', marginBottom: '20px',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 7px #818cf8', display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', fontWeight: '500', color: '#a5b4fc' }}>Employee onboarding, reimagined</span>
                </div>
                <h1 style={{ fontSize: '38px', fontWeight: '800', color: '#fff', lineHeight: '1.13', letterSpacing: '-0.035em', margin: '0 0 16px' }}>
                  Onboarding that<br />
                  <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    actually sticks.
                  </span>
                </h1>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.44)', lineHeight: '1.65', margin: 0, maxWidth: '320px' }}>
                  Structure the first 90 days for every new hire — from day one.
                </p>
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {FEATURES.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '6px',
                      background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px',
                    }}>
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#818cf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.52)', lineHeight: '1.5' }}>{f}</span>
                  </div>
                ))}
              </div>

              <MockCard />
            </div>

            {/* Testimonial */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '22px' }}>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="13" height="13" viewBox="0 0 14 14" fill="#f59e0b">
                    <path d="M7 1l1.6 4.9H14L9.9 9.1l1.6 4.9L7 11l-4.5 3 1.6-4.9L0 5.9h5.4L7 1z"/>
                  </svg>
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.46)', fontStyle: 'italic', margin: '0 0 12px', lineHeight: '1.55' }}>
                "We cut time-to-productivity by 40% in the first month."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff' }}>J</div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.62)' }}>Jamie Lee</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>Head of People, Bloom Studio</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '32px 24px', minHeight: '100vh' }}>
          <div style={{ width: '100%', maxWidth: '390px' }}>

            {/* Mobile logo */}
            <div className="flex lg:hidden" style={{ alignItems: 'center', gap: '9px', marginBottom: '36px' }}>
              <Logo size={32} />
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em' }}>Onboard</span>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.03em' }}>Welcome back</h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>Sign in to continue to your workspace.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', padding: '11px 14px', borderRadius: '10px', lineHeight: '1.5' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Work email</label>
                <input type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={`a-input${error ? ' err' : ''}`} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Password</label>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#6366f1', padding: 0, fontFamily: 'inherit', fontWeight: '500' }}>Forgot password?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={`a-input${error ? ' err' : ''}`} style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="a-eye" tabIndex={-1}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="a-btn" disabled={loading} style={{ marginTop: '4px' }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 14px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <button type="button" onClick={() => setShowDemo((v) => !v)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 15px', borderRadius: '10px', border: '1.5px dashed #c7d2fe',
              background: showDemo ? '#eef2ff' : '#f5f7ff', color: '#4338ca',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
            }}>
              <Zap size={14} />
              Try a demo account
              {showDemo ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
            </button>

            {showDemo && (
              <div style={{ marginTop: '8px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <button key={acc.id} onClick={() => doLogin(acc.email, acc.password)} className="demo-row">
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: acc.badge === 'Sample Data' ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                      {acc.label.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{acc.label}</p>
                      <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#94a3b8' }}>{acc.subtitle}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '500', padding: '3px 9px', borderRadius: '20px', flexShrink: 0, background: acc.badge === 'Sample Data' ? '#e0e7ff' : '#f1f5f9', color: acc.badge === 'Sample Data' ? '#4338ca' : '#64748b' }}>{acc.badge}</span>
                  </button>
                ))}
                <div style={{ padding: '10px 14px', fontSize: '11.5px', color: '#94a3b8', background: '#f8fafc', borderTop: '1px solid #f1f5f9', lineHeight: '1.8' }}>
                  Owner panel:{' '}
                  <code style={{ background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10.5px' }}>admin@onboard.app</code>
                  {' / '}
                  <code style={{ background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10.5px' }}>admin123</code>
                </div>
              </div>
            )}

            <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#64748b', margin: '28px 0 0' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>Create one free →</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
