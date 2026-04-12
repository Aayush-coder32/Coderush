import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../../lib/api'

/**
 * Stripe redirects here with ?session_id= — we verify server-side and confirm booking.
 */
export default function PaymentSuccessPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    if (!sessionId) {
      queueMicrotask(() => setStatus('missing'))
      return undefined
    }
    let alive = true
    client
      .get('/payments/verify-session', { params: { session_id: sessionId } })
      .then(() => {
        if (!alive) return
        setStatus('ok')
        toast.success('Payment confirmed!')
      })
      .catch(() => {
        if (alive) setStatus('error')
      })
    return () => {
      alive = false
    }
  }, [sessionId])

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
      {status === 'verifying' && <p className="text-slate-600 dark:text-slate-300">Verifying payment…</p>}
      {status === 'ok' && (
        <>
          <h1 className="text-2xl font-bold text-emerald-600">You&apos;re in!</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Your ticket is confirmed. Open your dashboard for the QR code.
          </p>
          <Link to="/dashboard" className="inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">
            Go to dashboard
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-red-600">Could not verify</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Check Stripe keys or try again from the event page.
          </p>
          <Link to="/events" className="text-indigo-600 hover:underline">
            Back to events
          </Link>
        </>
      )}
      {status === 'missing' && <p className="text-slate-600">No session id in URL.</p>}
    </div>
  )
}
