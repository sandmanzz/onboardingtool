import { useState } from 'react'

export default function IconButton({ icon: Icon, label, onClick, className = '', size = 17 }) {
  const [hover, setHover] = useState(false)

  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button onClick={onClick} className={className}>
        <Icon size={size} />
      </button>
      {hover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-gray-900 text-white text-[11px] font-medium whitespace-nowrap pointer-events-none z-10">
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5" />
        </div>
      )}
    </div>
  )
}
