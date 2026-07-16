import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Upload, ArrowRight, Check, Zap } from 'lucide-react'
import useStore from '../store/useStore'

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Consulting', 'Media & Entertainment', 'Real Estate', 'Other',
]

const SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-1000', label: '201–1000 employees' },
  { value: '1000+', label: '1000+ employees' },
]

export default function Setup() {
  const navigate = useNavigate()
  const setCompany = useStore((s) => s.setCompany)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    industry: '',
    size: '',
    website: '',
    description: '',
    logo: '',
    primaryColor: '#4f5fff',
  })
  const [errors, setErrors] = useState({})

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validate1 = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Company name is required'
    if (!form.industry) e.industry = 'Please select an industry'
    if (!form.size) e.size = 'Please select company size'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => update('logo', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleFinish = () => {
    setCompany({ ...form, createdAt: new Date().toISOString() })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-md">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl">Onboardly</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step > s
                    ? 'bg-brand-600 text-white'
                    : step === s
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`h-0.5 w-16 rounded ${
                    step > s ? 'bg-brand-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 1 ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Building2 size={20} className="text-brand-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Company Information
                  </h1>
                  <p className="text-sm text-gray-500">
                    Tell us about your organization
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Company Name *</label>
                  <input
                    className={`input ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="e.g. Acme Corporation"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="label">Industry *</label>
                  <select
                    className={`input ${errors.industry ? 'border-red-400' : ''}`}
                    value={form.industry}
                    onChange={(e) => update('industry', e.target.value)}
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="text-xs text-red-500 mt-1">{errors.industry}</p>
                  )}
                </div>

                <div>
                  <label className="label">Company Size *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => update('size', s.value)}
                        className={`px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all ${
                          form.size === s.value
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {errors.size && (
                    <p className="text-xs text-red-500 mt-1">{errors.size}</p>
                  )}
                </div>

                <div>
                  <label className="label">Website</label>
                  <input
                    className="input"
                    placeholder="https://yourcompany.com"
                    value={form.website}
                    onChange={(e) => update('website', e.target.value)}
                  />
                </div>
              </div>

              <button
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                onClick={() => {
                  if (validate1()) setStep(2)
                }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Upload size={20} className="text-brand-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Branding & Description
                  </h1>
                  <p className="text-sm text-gray-500">
                    Personalize your onboarding experience
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Company Logo</label>
                  <label className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors group">
                    {form.logo ? (
                      <img
                        src={form.logo}
                        className="w-16 h-16 rounded-xl object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Upload size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {form.logo ? 'Change logo' : 'Upload logo'}
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>

                <div>
                  <label className="label">About Your Company</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Brief description of what your company does and its culture..."
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
                      value={form.primaryColor}
                      onChange={(e) => update('primaryColor', e.target.value)}
                    />
                    <input
                      className="input flex-1"
                      value={form.primaryColor}
                      onChange={(e) => update('primaryColor', e.target.value)}
                      placeholder="#4f5fff"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="btn-secondary flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  onClick={handleFinish}
                >
                  <Check size={16} />
                  Finish Setup
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Your data is stored locally and never shared
        </p>
      </div>
    </div>
  )
}
