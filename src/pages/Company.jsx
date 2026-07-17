import { useState, useEffect } from 'react'
import { Building2, Save, Upload, Check, Plus, Pencil, Trash2, X } from 'lucide-react'
import useStore from '../store/useStore'

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Food & Beverage', 'Manufacturing', 'Consulting', 'Media & Entertainment',
  'Real Estate', 'Logistics', 'Other',
]

const SIZES = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-1000', label: '201–1000' },
  { value: '1000+', label: '1000+' },
]

function DepartmentsEditor({ departments = [], onAdd, onRename, onDelete }) {
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null) // { idx, value }

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed || departments.includes(trimmed)) return
    onAdd(trimmed)
    setNewName('')
  }

  const handleRenameCommit = () => {
    if (!editing) return
    const trimmed = editing.value.trim()
    const original = departments[editing.idx]
    if (trimmed && trimmed !== original && !departments.includes(trimmed)) {
      onRename(original, trimmed)
    }
    setEditing(null)
  }

  return (
    <div>
      {/* List */}
      <div className="space-y-1.5 mb-3">
        {departments.length === 0 && (
          <p className="text-sm text-gray-400 italic py-2">No departments yet. Add one below.</p>
        )}
        {departments.map((dept, idx) => (
          <div key={dept} className="flex items-center gap-2 group">
            {editing?.idx === idx ? (
              <>
                <input
                  className="input flex-1 py-1.5 text-sm"
                  value={editing.value}
                  autoFocus
                  onChange={(e) => setEditing({ idx, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameCommit()
                    if (e.key === 'Escape') setEditing(null)
                  }}
                />
                <button onClick={handleRenameCommit} className="text-green-600 hover:text-green-700 p-1">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  {dept}
                </span>
                <button
                  onClick={() => setEditing({ idx, value: dept })}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600 p-1 transition-opacity"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(dept)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="flex items-center gap-2">
        <input
          className="input flex-1 text-sm py-1.5"
          placeholder="New department name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || departments.includes(newName.trim())}
          className="btn-primary py-1.5 px-3 flex items-center gap-1 disabled:opacity-40 text-sm"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  )
}

export default function Company() {
  const { company, updateCompany, addDepartment, renameDepartment, deleteDepartment } = useStore()
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
        <p className="text-gray-500 mt-1">Manage your company information, departments, and branding</p>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Company Logo</h2>
          <div className="flex items-center gap-5">
            {form.logo ? (
              <img src={form.logo} className="w-20 h-20 rounded-xl object-cover border border-gray-100" alt="" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                <Building2 size={28} className="text-gray-400" />
              </div>
            )}
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              {form.logo ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="label">Company Name</label>
            <input className="input" value={form.name || ''} onChange={(e) => update('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Industry</label>
              <select className="input" value={form.industry || ''} onChange={(e) => update('industry', e.target.value)}>
                <option value="">Select</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Company Size</label>
              <select className="input" value={form.size || ''} onChange={(e) => update('size', e.target.value)}>
                <option value="">Select</option>
                {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label} employees</option>)}
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

        {/* Departments */}
        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Departments</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              These appear in employee profiles. Renaming a department updates all employees automatically.
            </p>
          </div>
          <DepartmentsEditor
            departments={company?.departments || []}
            onAdd={addDepartment}
            onRename={renameDepartment}
            onDelete={deleteDepartment}
          />
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
            <p className="text-xs text-gray-400 mt-1">Used in employee-facing onboarding views</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`btn-primary flex items-center gap-2 w-full justify-center ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
