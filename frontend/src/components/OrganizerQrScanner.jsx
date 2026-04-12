import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, CameraOff } from 'lucide-react'

const REGION_ID = 'organizer-qr-reader'

/**
 * Uses the device camera to read ticket QR codes (JSON payload or plain TKT-… code).
 */
export default function OrganizerQrScanner({ onDecoded, disabled }) {
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef(null)

  const stopScanner = useCallback(async () => {
    setError('')
    try {
      const s = scannerRef.current
      if (s) {
        await s.stop()
        await s.clear()
      }
    } catch {
      /* scanner may already be stopped */
    }
    scannerRef.current = null
    setActive(false)
  }, [])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const startScanner = async () => {
    if (disabled) return
    setError('')
    await stopScanner()
    try {
      const qr = new Html5Qrcode(REGION_ID, { verbose: false })
      scannerRef.current = qr
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          try {
            await qr.stop()
            await qr.clear()
          } catch {
            /* ignore */
          }
          scannerRef.current = null
          setActive(false)
          onDecoded(decodedText)
        },
        () => {}
      )
      setActive(true)
    } catch (e) {
      setError(e.message || 'Camera permission denied or not available')
      setActive(false)
    }
  }

  return (
    <div className="space-y-3">
      <div
        id={REGION_ID}
        className={`mx-auto overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 ${active ? 'min-h-[280px]' : 'min-h-0'}`}
      />
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            disabled={disabled}
            onClick={startScanner}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            Scan QR with camera
          </button>
        ) : (
          <button
            type="button"
            onClick={stopScanner}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-600"
          >
            <CameraOff className="h-4 w-4" />
            Stop camera
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Point at the attendee&apos;s ticket QR. We accept JSON payloads or a plain ticket code.
      </p>
    </div>
  )
}
