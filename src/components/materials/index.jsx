import { useState } from 'react'
import {
  Check, ExternalLink, Play, Clock, CheckSquare, Square, Camera, X, Paperclip, Download,
  Video, ListChecks, FileText, ClipboardList, Wrench, FileSignature, Calendar,
} from 'lucide-react'

export const MATERIAL_ICONS = {
  video: Video,
  reading: FileText,
  checklist: ListChecks,
  quiz: ClipboardList,
  task: Wrench,
  document: FileSignature,
  meeting: Calendar,
}

function getVideoEmbed(url) {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

export function VideoMaterial({ material, onComplete, completed }) {
  const embed = getVideoEmbed(material.url)
  return (
    <div>
      {embed ? (
        <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
          <iframe src={embed} className="w-full h-full" allowFullScreen title={material.title} />
        </div>
      ) : material.url ? (
        <a
          href={material.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors mb-4 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <Play size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-purple-900">{material.title}</p>
            {material.duration && (
              <p className="text-sm text-purple-600 flex items-center gap-1">
                <Clock size={12} /> {material.duration}
              </p>
            )}
          </div>
          <ExternalLink size={16} className="text-purple-400 group-hover:text-purple-600" />
        </a>
      ) : (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 mb-4">
          <p className="text-purple-700 text-sm">No video URL provided</p>
        </div>
      )}
      <button
        onClick={onComplete}
        className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          completed
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-brand-600 hover:bg-brand-700 text-white'
        }`}
      >
        {completed ? <><Check size={16} /> Completed</> : 'Mark as Watched'}
      </button>
    </div>
  )
}

export function ReadingMaterial({ material, onComplete, completed }) {
  return (
    <div>
      {material.content && (
        <div className="prose prose-sm max-w-none mb-4 p-5 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
          {material.content}
        </div>
      )}
      {material.url && (
        <a
          href={material.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 mb-4 font-medium"
        >
          <ExternalLink size={14} />
          Open full document
        </a>
      )}
      <button
        onClick={onComplete}
        className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          completed
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-brand-600 hover:bg-brand-700 text-white'
        }`}
      >
        {completed ? <><Check size={16} /> Read</> : 'Mark as Read'}
      </button>
    </div>
  )
}

export function ChecklistMaterial({ material, onComplete, completed, onDetail, initialDetail }) {
  const [checked, setChecked] = useState(initialDetail?.checked || {})
  const [photos, setPhotos] = useState(initialDetail?.photos || {})
  const [pendingPhotoIdx, setPendingPhotoIdx] = useState(null)
  const items = (material.items || []).map((it) =>
    typeof it === 'string' ? { text: it, photoRequired: false } : it
  )
  const allChecked = items.length > 0 && items.every((_, i) => checked[i])

  const check = (idx, nextPhotos) => {
    const next = { ...checked, [idx]: true }
    setChecked(next)
    const done = items.every((_, i) => next[i])
    if (onDetail) onDetail({ checked: next, photos: nextPhotos || photos, completedAt: done ? new Date().toISOString() : null })
    if (done) onComplete()
  }

  const toggle = (idx) => {
    if (checked[idx]) {
      const next = { ...checked, [idx]: false }
      setChecked(next)
      if (onDetail) onDetail({ checked: next, photos })
      return
    }
    if (items[idx].photoRequired && !photos[idx]) {
      setPendingPhotoIdx(idx)
      return
    }
    check(idx)
  }

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    const idx = pendingPhotoIdx
    setPendingPhotoIdx(null)
    if (!file || idx === null) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const nextPhotos = { ...photos, [idx]: ev.target.result }
      setPhotos(nextPhotos)
      check(idx, nextPhotos)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
            checked[idx]
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-gray-200'
          }`}
        >
          <button onClick={() => toggle(idx)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            {checked[idx] ? (
              <CheckSquare size={20} className="text-green-600 shrink-0" />
            ) : (
              <Square size={20} className="text-gray-400 shrink-0" />
            )}
            <span className={`text-sm font-medium ${checked[idx] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item.text}
            </span>
            {item.photoRequired && !checked[idx] && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
                <Camera size={10} /> Photo required
              </span>
            )}
          </button>
          {photos[idx] && (
            <img src={photos[idx]} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          )}
        </div>
      ))}
      {allChecked && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-100 text-green-700 text-sm font-medium">
          <Check size={16} />
          All tasks completed!
        </div>
      )}

      {pendingPhotoIdx !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Camera size={16} /> Photo Required
              </h3>
              <button onClick={() => setPendingPhotoIdx(null)} className="btn-ghost p-1.5">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Take or upload a photo to confirm "{items[pendingPhotoIdx]?.text}" is done.
            </p>
            <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 cursor-pointer text-sm text-gray-600 transition-all">
              <Camera size={16} />
              Take / Upload Photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export function QuizMaterial({ material, onComplete, completed, onDetail, initialDetail }) {
  const questions = material.questions || []
  const [answers, setAnswers] = useState(initialDetail?.answers || {})
  const [submitted, setSubmitted] = useState(!!initialDetail)

  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined)
  const correctCount = questions.filter((q, i) => answers[i] === q.correct).length
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  const passed = score >= (material.passingScore ?? 75)

  const handleSubmit = () => {
    setSubmitted(true)
    if (onDetail) onDetail({ answers, score, passed, submittedAt: new Date().toISOString() })
    if (passed) onComplete()
  }

  const handleRetry = () => {
    setAnswers({})
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className={`p-5 rounded-xl border text-center ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}%</p>
          <p className={`text-sm font-semibold mt-1 ${passed ? 'text-green-700' : 'text-red-700'}`}>
            {passed ? 'Passed!' : `Not quite — need ${material.passingScore ?? 75}% to pass`}
          </p>
          <p className="text-xs text-gray-500 mt-1">{correctCount} of {questions.length} correct</p>
        </div>
        <div className="space-y-3">
          {questions.map((q, qi) => (
            <div key={qi} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-sm font-medium text-gray-800 mb-2">{qi + 1}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`text-xs px-2 py-1 rounded-md ${
                      oi === q.correct
                        ? 'bg-green-100 text-green-700 font-medium'
                        : oi === answers[qi]
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {!passed && (
          <button onClick={handleRetry} className="w-full btn-primary py-3.5 active:scale-[0.98] transition-all">
            Retry Quiz
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-sm font-medium text-gray-800 mb-3">{qi + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                className={`w-full flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                  answers[qi] === oi
                    ? 'border-brand-400 bg-brand-50 text-brand-700 font-medium'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${answers[qi] === oi ? 'border-brand-600' : 'border-gray-300'}`}>
                  {answers[qi] === oi && <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                </div>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full btn-primary py-3.5 disabled:opacity-40 active:scale-[0.98] transition-all"
      >
        Submit Quiz
      </button>
    </div>
  )
}

export function DocumentMaterial({ material, onComplete, completed, onDetail, signerName }) {
  const handleComplete = () => {
    if (onDetail) onDetail({ signedBy: signerName || null, signedAt: new Date().toISOString() })
    onComplete()
  }
  return (
    <div className="space-y-4">
      {material.description && (
        <div
          className="prose prose-sm max-w-none p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: material.description }}
        />
      )}
      {material.fileUrl && (
        <a
          href={material.fileUrl}
          download={material.fileName || 'document'}
          className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center shrink-0">
            <Paperclip size={16} className="text-white" />
          </div>
          <span className="flex-1 text-sm font-medium text-rose-900 truncate">
            {material.fileName || 'Attached document'}
          </span>
          <Download size={16} className="text-rose-400 group-hover:text-rose-600 shrink-0" />
        </a>
      )}
      <button
        onClick={handleComplete}
        className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          completed
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-brand-600 hover:bg-brand-700 text-white'
        }`}
      >
        {completed ? (
          <><Check size={16} /> {material.acknowledgmentRequired ? 'Acknowledged' : 'Read'}</>
        ) : material.acknowledgmentRequired ? (
          signerName ? `I Acknowledge — ${signerName}` : 'I Acknowledge'
        ) : (
          'Mark as Read'
        )}
      </button>
    </div>
  )
}

export function TaskMaterial({ material, onComplete, completed }) {
  return (
    <div className="space-y-4">
      {material.instructions && (
        <div
          className="prose prose-sm max-w-none p-4 rounded-xl bg-orange-50 border border-orange-100 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: material.instructions }}
        />
      )}
      <button
        onClick={onComplete}
        className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          completed
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-brand-600 hover:bg-brand-700 text-white'
        }`}
      >
        {completed ? <><Check size={16} /> Completed</> : material.requiresConfirmation ? 'Confirm Completion' : 'Mark as Done'}
      </button>
    </div>
  )
}

export function MeetingMaterial({ material, onComplete, completed }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-sm">
        {material.with && <span className="text-indigo-700 font-medium">With {material.with}</span>}
        {material.durationMin && (
          <span className="flex items-center gap-1 text-indigo-500">
            <Clock size={12} /> {material.durationMin} min
          </span>
        )}
      </div>
      {material.notes && (
        <div
          className="prose prose-sm max-w-none p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: material.notes }}
        />
      )}
      <button
        onClick={onComplete}
        className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
          completed
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-brand-600 hover:bg-brand-700 text-white'
        }`}
      >
        {completed ? <><Check size={16} /> Done</> : 'Mark as Done'}
      </button>
    </div>
  )
}

export function MaterialRenderer({ material, completed, onComplete, onDetail, initialDetail, signerName }) {
  if (!material) return null
  const shared = { material, completed, onComplete }
  switch (material.type) {
    case 'video': return <VideoMaterial {...shared} />
    case 'reading': return <ReadingMaterial {...shared} />
    case 'checklist': return <ChecklistMaterial {...shared} onDetail={onDetail} initialDetail={initialDetail} />
    case 'quiz': return <QuizMaterial {...shared} onDetail={onDetail} initialDetail={initialDetail} />
    case 'document': return <DocumentMaterial {...shared} onDetail={onDetail} signerName={signerName} />
    case 'task': return <TaskMaterial {...shared} />
    case 'meeting': return <MeetingMaterial {...shared} />
    default: return null
  }
}
