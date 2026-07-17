import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QRCodeImage({ value, size = 160, className = '' }) {
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!value) { setDataUrl(''); return }
    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: '#111827', light: '#ffffff' } })
      .then((url) => { if (!cancelled) setDataUrl(url) })
      .catch(() => { if (!cancelled) setDataUrl('') })
    return () => { cancelled = true }
  }, [value, size])

  if (!dataUrl) {
    return <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`} style={{ width: size, height: size }} />
  }

  return (
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className={`rounded-lg border border-gray-200 ${className}`}
    />
  )
}
