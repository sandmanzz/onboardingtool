import { useState } from 'react'
import { Video, ListChecks, FileText, Plus, X, Check } from 'lucide-react'

const TYPES = [
  { type: 'video', icon: Video, label: 'Video', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { type: 'checklist', icon: ListChecks, label: 'Checklist', color: 'text-green-600 bg-green-50 border-green-200' },
  { type: 'reading', icon: FileText, label: 'Reading', color: 'text-blue-600 bg-blue-50 border-blue-200' },
]

export default function MaterialEditor({ initial, defaultType, onSave, onCancel }) {
  const [type, setType] = useState(initial?.type || defaultType || 'video')
  const [title, setTitle] = useState(initial?.title || '')
  const [url, setUrl] = useState(initial?.url || '')
  const [content, setContent] = useState(initial?.content || '')
  const [items, setItems] = useState(initial?.items || [''])
  const [duration, setDuration] = useState(initial?.duration || '')

  const addItem = () => setItems((i) => [...i, ''])
  const removeItem = (idx) => setItems((i) => i.filter((_, j) => j !== idx))
  const updateItem = (idx, val) =>
    setItems((i) => i.map((x, j) => (j === idx ? val : x)))

  const handleSave = () => {
    if (!title.trim()) return
    const data = { type, title }
    if (type === 'video') { data.url = url; data.duration = duration }
    if (type === 'reading') { data.url = url; data.content = content }
    if (type === 'checklist') { data.items = items.filter((i) => i.trim()) }
    onSave(data)
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="label">Material Type</label>
        <div className="flex gap-2">
          {TYPES.map(({ type: t, icon: Icon, label, color }) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                type === t ? color : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="label">Title *</label>
        <input
          className="input"
          placeholder={
            type === 'video'
              ? 'e.g. Company Culture Introduction'
              : type === 'checklist'
              ? 'e.g. First Day Setup Checklist'
              : 'e.g. Employee Handbook'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Type-specific fields */}
      {type === 'video' && (
        <>
          <div>
            <label className="label">Video URL</label>
            <input
              className="input"
              placeholder="https://youtube.com/watch?v=... or Vimeo URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Duration (optional)</label>
            <input
              className="input"
              placeholder="e.g. 10 min"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </>
      )}

      {type === 'reading' && (
        <>
          <div>
            <label className="label">Link (optional)</label>
            <input
              className="input"
              placeholder="https://docs.company.com/handbook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Content / Summary</label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Write the content here or paste a summary..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </>
      )}

      {type === 'checklist' && (
        <div>
          <label className="label">Checklist Items</label>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0" />
                <input
                  className="input"
                  placeholder={`Item ${idx + 1}`}
                  value={item}
                  onChange={(e) => updateItem(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addItem()
                  }}
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={14} />
              Add item
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Check size={16} />
          Save Material
        </button>
      </div>
    </div>
  )
}
