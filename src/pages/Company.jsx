import { useState, useEffect } from 'react'
import { Building2, Save, Upload, Check } from 'lucide-react'
import useStore from '../store/useStore'

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Consulting', 'Media & Entertainment', 'Real Estate', 'Other',
]

const SIZES = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-1000', label: '201–1000' },
  { value: '1000+', label: '1000+' },
]

export default function Company() {
  const { company, updateCompany } = useStore()
  const [form, setForm] = useState(company || {})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(company || {})
  }, [company])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => update('logo', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    updateCompany(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-500 mt-1">
          Update your company information and branding
        </p>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Company Logo</h2>
          <div className="flex items-center gap-5">
            {form.logo ? (
              <img
                src={form.logo}
                className="w-20 h-20 rounded-xl object-cover border border-gray-100"
                alt=""
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                <Building2 size={28} className="text-gray-400" />
              </div>
            )}
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              {form.logo ? 'Change Logo' : 'Upload Logo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="label">Company Name</label>
            <input
              className="input"
              value={form.name || ''}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Industry</label>
              <select
                className="input"
                value={form.industry || ''}
                onChange={(e) => update('industry', e.target.value)}
              >
                <option value="">Select</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Company Size</label>
              <select
                className="input"
                value={form.size || ''}
                onChange={(e) => update('size', e.target.value)}
              >
                <option value="">Select</option>
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label} employees</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Website</label>
            <input
              className="input"
              placeholder="https://yourcompany.com"
              value={form.website || ''}
              onChange={(e) => update('website', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Company Description</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Describe your company, culture, and mission..."
              value={form.description || ''}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
        </div>

        {/* Branding */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Branding</h2>
          <div>
            <label className="label">Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
                value={form.primaryColor || '#4f5fff'}
                onChange={(e) => update('primaryColor', e.target.value)}
              />
              <input
                className="input flex-1"
                value={form.primaryColor || '#4f5fff'}
                onChange={(e) => update('primaryColor', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Used in employee-facing onboarding views
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`btn-primary flex items-center gap-2 w-full justify-center ${
            saved ? 'bg-green-600 hover:bg-green-600' : ''
          }`}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
