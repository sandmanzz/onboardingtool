import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import useToastStore from '../store/useToastStore'

export default function Toast() {
  const { toast, hideToast } = useToastStore()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(hideToast, 3000)
    return () => clearTimeout(t)
  }, [toast, hideToast])

  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div className="fixed bottom-5 right-5 z-[100] animate-in fade-in slide-in-from-bottom-2">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          isError
            ? 'bg-red-600 border-red-700 text-white'
            : 'bg-gray-900 border-gray-800 text-white'
        }`}
      >
        {isError ? <AlertCircle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
        <span>{toast.message}</span>
        <button onClick={hideToast} className="ml-1 text-white/60 hover:text-white shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
