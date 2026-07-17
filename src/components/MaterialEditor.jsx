import { useState } from 'react'
import {
  Video, ListChecks, FileText, Plus, X, Check,
  ClipboardList, Wrench, FileSignature, Calendar, Upload, Paperclip,
  ChevronDown, FileCheck2,
} from 'lucide-react'
import RichTextEditor from './RichTextEditor'

const TYPES = [
  { type: 'video', icon: Video, label: 'Video', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { type: 'reading', icon: FileText, label: 'Reading', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { type: 'checklist', icon: ListChecks, label: 'Checklist', color: 'text-green-600 bg-green-50 border-green-200' },
  { type: 'quiz', icon: ClipboardList, label: 'Quiz', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { type: 'task', icon: Wrench, label: 'Task', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { type: 'document', icon: FileSignature, label: 'Document', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { type: 'meeting', icon: Calendar, label: 'Meeting', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
]

const EMPTY_QUESTION = () => ({ question: '', options: ['', '', '', ''], correct: 0 })

export default function MaterialEditor({ initial, defaultType, onSave, onCancel }) {
  const [type, setType] = useState(initial?.type || defaultType || 'video')
  const [title, setTitle] = useState(initial?.title || '')

  // video / reading
  const [url, setUrl] = useState(initial?.url || '')
  const [content, setContent] = useState(initial?.content || '')
  const [duration, setDuration] = useState(initial?.duration || '')

  // checklist — normalize legacy string items into { text, description, photoRequired } objects
  const normalizeItems = (raw) =>
    raw.map((it) => (typeof it === 'string' ? { text: it, description: '', photoRequired: false } : { description: '', ...it }))
  const [items, setItems] = useState(
    initial?.items?.length ? normalizeItems(initial.items) : [{ text: '', description: '', photoRequired: false }]
  )
  const [expandedItems, setExpandedItems] = useState({})

  // quiz
  const [questions, setQuestions] = useState(
    initial?.questions?.length ? initial.questions : [EMPTY_QUESTION()]
  )
  const [passingScore, setPassingScore] = useState(initial?.passingScore ?? 75)

  // task
  const [instructions, setInstructions] = useState(initial?.instructions || '')
  const [requiresConfirmation, setRequiresConfirmation] = useState(initial?.requiresConfirmation ?? true)

  // document
  const [description, setDescription] = useState(initial?.description || '')
  const [acknowledgmentRequired, setAcknowledgmentRequired] = useState(initial?.acknowledgmentRequired ?? true)
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl || '')
  const [fileName, setFileName] = useState(initial?.fileName || '')

  // meeting
  const [meetingWith, setMeetingWith] = useState(initial?.with || '')
  const [durationMin, setDurationMin] = useState(initial?.durationMin || 30)
  const [notes, setNotes] = useState(initial?.notes || '')

  // ── Checklist helpers ────────────────────────────────────────────────────
  const addItem = () => setItems((i) => [...i, { text: '', description: '', photoRequired: false }])
  const removeItem = (idx) => setItems((i) => i.filter((_, j) => j !== idx))
  const updateItem = (idx, val) =>
    setItems((i) => i.map((x, j) => (j === idx ? { ...x, text: val } : x)))
  const updateItemDescription = (idx, val) =>
    setItems((i) => i.map((x, j) => (j === idx ? { ...x, description: val } : x)))
  const toggleProofRequired = (idx) =>
    setItems((i) => i.map((x, j) => (j === idx ? { ...x, photoRequired: !x.photoRequired } : x)))
  const toggleExpanded = (idx) =>
    setExpandedItems((e) => ({ ...e, [idx]: !e[idx] }))

  // ── Document helpers ─────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setFileUrl(ev.target.result)
      setFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  // ── Quiz helpers ─────────────────────────────────────────────────────────
  const addQuestion = () => setQuestions((q) => [...q, EMPTY_QUESTION()])
  const removeQuestion = (qi) => setQuestions((q) => q.filter((_, i) => i !== qi))
  const updateQuestion = (qi, field, val) =>
    setQuestions((q) => q.map((qq, i) => (i === qi ? { ...qq, [field]: val } : qq)))
  const updateOption = (qi, oi, val) =>
    setQuestions((q) =>
      q.map((qq, i) =>
        i !== qi ? qq : { ...qq, options: qq.options.map((o, j) => (j === oi ? val : o)) }
      )
    )

  const handleSave = () => {
    if (!title.trim()) return
    const base = { type, title }
    if (type === 'video') return onSave({ ...base, url, duration })
    if (type === 'reading') return onSave({ ...base, url, content })
    if (type === 'checklist') return onSave({ ...base, items: items.filter((i) => i.text.trim()) })
    if (type === 'quiz') return onSave({ ...base, questions, passingScore: Number(passingScore) })
    if (type === 'task') return onSave({ ...base, instructions, requiresConfirmation })
    if (type === 'document') return onSave({ ...base, description, acknowledgmentRequired, fileUrl, fileName })
    if (type === 'meeting') return onSave({ ...base, with: meetingWith, durationMin: Number(durationMin), notes })
  }

  const getPlaceholder = () => {
    const map = {
      video: 'e.g. Food Safety Introduction Video',
      reading: 'e.g. Employee Handbook',
      checklist: 'e.g. Day 1 Setup Checklist',
      quiz: 'e.g. Food Safety Knowledge Check',
      task: 'e.g. Shadow Senior Chef for 1 Shift',
      document: 'e.g. Kitchen Rules & Code of Conduct',
      meeting: 'e.g. Welcome Meeting with Manager',
    }
    return map[type] || 'Title'
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="label">Material Type</label>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map(({ type: t, icon: Icon, label, color }) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-xs font-medium transition-all ${
                type === t ? color : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
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
          placeholder={getPlaceholder()}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* ── Video ─────────────────────────────────────────────────────────── */}
      {type === 'video' && (
        <>
          <div>
            <label className="label">Video URL</label>
            <input
              className="input"
              placeholder="https://youtube.com/watch?v=..."
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

      {/* ── Reading ───────────────────────────────────────────────────────── */}
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
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write the content here or paste a summary..."
              minRows={4}
            />
          </div>
        </>
      )}

      {/* ── Checklist ─────────────────────────────────────────────────────── */}
      {type === 'checklist' && (
        <div>
          <label className="label">Checklist Items</label>
          <div className="space-y-2">
            {items.map((item, idx) => {
              const isOpen = !!expandedItems[idx]
              return (
                <div key={idx} className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-2 p-2 bg-white">
                    <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0" />
                    <input
                      className="input"
                      placeholder={`Item ${idx + 1}`}
                      value={item.text}
                      onChange={(e) => updateItem(idx, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
                    />
                    <button
                      type="button"
                      title={isOpen ? 'Hide detail & proof settings' : 'Add detail or require proof'}
                      onClick={() => toggleExpanded(idx)}
                      className={`p-1.5 rounded shrink-0 transition-colors ${
                        isOpen || item.description || item.photoRequired
                          ? 'bg-brand-100 text-brand-700'
                          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 p-1 rounded shrink-0">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {isOpen && (
                    <div className="p-3 pt-2.5 bg-gray-50 border-t border-gray-200 space-y-2.5">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Detailed explanation (optional)
                        </label>
                        <textarea
                          className="textarea text-sm"
                          rows={2}
                          placeholder="Explain exactly what 'done' looks like for this item — e.g. which form to use, who to check in with, what counts as complete..."
                          value={item.description}
                          onChange={(e) => updateItemDescription(idx, e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleProofRequired(idx)}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-colors ${item.photoRequired ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white'}`}>
                          {item.photoRequired && <Check size={11} className="text-white" />}
                        </div>
                        <span className="text-gray-700 flex items-center gap-1.5">
                          <FileCheck2 size={13} className="text-gray-400" />
                          Require proof upload (photo or file) before this can be checked off
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={14} />
              Add item
            </button>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <ChevronDown size={12} />
              Click the arrow on an item to add a detailed explanation or require proof of completion
            </p>
          </div>
        </div>
      )}

      {/* ── Quiz ──────────────────────────────────────────────────────────── */}
      {type === 'quiz' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="label">Passing Score (%)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Questions</label>
            <div className="space-y-4">
              {questions.map((q, qi) => (
                <div key={qi} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {qi + 1}
                    </span>
                    <input
                      className="input flex-1"
                      placeholder="Enter your question..."
                      value={q.question}
                      onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                    />
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qi)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded mt-0.5"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="ml-7 space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(qi, 'correct', oi)}
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            q.correct === oi ? 'border-green-500 bg-green-500' : 'border-gray-300'
                          }`}
                        >
                          {q.correct === oi && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </button>
                        <input
                          className="input text-sm"
                          placeholder={`Option ${oi + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">Click the circle to mark the correct answer</p>
                  </div>
                </div>
              ))}
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                <Plus size={14} />
                Add question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task ──────────────────────────────────────────────────────────── */}
      {type === 'task' && (
        <>
          <div>
            <label className="label">Instructions</label>
            <RichTextEditor
              value={instructions}
              onChange={setInstructions}
              placeholder="Describe exactly what the employee needs to do to complete this task..."
              minRows={4}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRequiresConfirmation(!requiresConfirmation)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                requiresConfirmation ? 'bg-brand-600 border-brand-600' : 'border-gray-300'
              }`}
            >
              {requiresConfirmation && <Check size={12} className="text-white" />}
            </button>
            <label className="text-sm text-gray-700">
              Requires supervisor confirmation to mark complete
            </label>
          </div>
        </>
      )}

      {/* ── Document ──────────────────────────────────────────────────────── */}
      {type === 'document' && (
        <>
          <div>
            <label className="label">Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe what this document contains and why the employee needs to read it..."
              minRows={3}
            />
          </div>
          <div>
            <label className="label">Attach File (optional)</label>
            {fileName ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50">
                <Paperclip size={14} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{fileName}</span>
                <button
                  type="button"
                  onClick={() => { setFileUrl(''); setFileName('') }}
                  className="text-gray-400 hover:text-red-500 p-1 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 cursor-pointer text-sm text-gray-500 transition-all">
                <Upload size={14} />
                Upload a document (PDF, DOCX, image...)
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAcknowledgmentRequired(!acknowledgmentRequired)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                acknowledgmentRequired ? 'bg-brand-600 border-brand-600' : 'border-gray-300'
              }`}
            >
              {acknowledgmentRequired && <Check size={12} className="text-white" />}
            </button>
            <label className="text-sm text-gray-700">
              Employee must sign/acknowledge to complete
            </label>
          </div>
        </>
      )}

      {/* ── Meeting ───────────────────────────────────────────────────────── */}
      {type === 'meeting' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Meet with</label>
              <input
                className="input"
                placeholder="e.g. Your Manager"
                value={meetingWith}
                onChange={(e) => setMeetingWith(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input
                className="input"
                type="number"
                placeholder="e.g. 30"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Agenda / Notes</label>
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="What should be discussed in this meeting?"
              minRows={3}
            />
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
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
