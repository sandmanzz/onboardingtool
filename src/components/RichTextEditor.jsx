import { useRef, useEffect, useCallback } from 'react'
import { Bold, Italic, List, ListOrdered, Minus } from 'lucide-react'

function ToolbarBtn({ onMouseDown, title, children, active }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
        active
          ? 'bg-brand-100 text-brand-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, placeholder, minRows = 3 }) {
  const editorRef = useRef(null)
  const isInternalChange = useRef(false)
  const minHeight = minRows * 24 + 16

  // sync external value into DOM only when it actually differs (and not from user typing)
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || ''
    }
  }, [value])

  const handleInput = useCallback(() => {
    isInternalChange.current = true
    onChange(editorRef.current?.innerHTML || '')
  }, [onChange])

  const exec = useCallback((e, cmd, val) => {
    e.preventDefault()
    editorRef.current?.focus()
    document.execCommand(cmd, false, val ?? null)
    handleInput()
  }, [handleInput])

  const insertHr = useCallback((e) => {
    e.preventDefault()
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, '<hr/><br/>')
    handleInput()
  }, [handleInput])

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-400 transition-all bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <ToolbarBtn title="Bold" onMouseDown={(e) => exec(e, 'bold')}>
          <Bold size={13} />
        </ToolbarBtn>
        <ToolbarBtn title="Italic" onMouseDown={(e) => exec(e, 'italic')}>
          <Italic size={13} />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarBtn title="Bullet list" onMouseDown={(e) => exec(e, 'insertUnorderedList')}>
          <List size={13} />
        </ToolbarBtn>
        <ToolbarBtn title="Numbered list" onMouseDown={(e) => exec(e, 'insertOrderedList')}>
          <ListOrdered size={13} />
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarBtn title="Divider" onMouseDown={insertHr}>
          <Minus size={13} />
        </ToolbarBtn>
      </div>

      {/* Editable area */}
      <div className="relative">
        {/* Placeholder */}
        {!value && (
          <p className="absolute top-3 left-3 text-sm text-gray-400 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          style={{ minHeight }}
          className="px-3 py-2.5 text-sm text-gray-800 outline-none rte-content"
        />
      </div>

      <style>{`
        .rte-content ul { list-style: disc; padding-left: 1.2em; margin: 0.25em 0; }
        .rte-content ol { list-style: decimal; padding-left: 1.2em; margin: 0.25em 0; }
        .rte-content li { margin: 0.1em 0; }
        .rte-content b, .rte-content strong { font-weight: 600; }
        .rte-content i, .rte-content em { font-style: italic; }
        .rte-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.5em 0; }
        .rte-content p { margin: 0; }
        .rte-content br { display: block; }
      `}</style>
    </div>
  )
}
