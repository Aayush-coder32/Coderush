import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../../lib/api'
import OrganizerQrScanner from '../../components/OrganizerQrScanner'
import { BarChart3, QrCode, Users, ScanLine } from 'lucide-react'

export default function FacultyDashboardPage() {
  const [dash, setDash] = useState(null)
  const [checkCode, setCheckCode] = useState('')
  const [attendees, setAttendees] = useState(null)

  const load = async () => {
    const { data } = await client.get('/faculty/dashboard')
    setDash(data)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load faculty stats')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const checkIn = async (e) => {
    e.preventDefault()
    try {
      const { data } = await client.post('/faculty/checkin', { ticketCode: checkCode.trim() })
      toast.success(data.message || 'Checked in')
      setCheckCode('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed')
    }
  }

  const checkInFromScan = async (raw) => {
    const text = raw?.trim?.() || ''
    if (!text) return
    try {
      const { data } = await client.post('/faculty/checkin', { qrRaw: text })
      toast.success(data.message || 'Checked in')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed')
    }
  }

  const loadAttendees = async (eventId) => {
    try {
      const { data } = await client.get(`/faculty/events/${eventId}/attendees`)
      setAttendees(data)
    } catch {
      toast.error('Could not load attendees')
    }
  }

  if (!dash) return <p className="text-slate-500">Loading…</p>

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Faculty console</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/attendance/manage"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ScanLine className="h-4 w-4" /> Class attendance
          </Link>
          <Link
            to="/events/new"
            className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            + New event
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total registrations</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{dash.totals.registrations}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Revenue (₹)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{dash.totals.revenue}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Event check-ins</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{dash.totals.checkedIn}</p>
        </div>
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <QrCode className="h-5 w-5" /> Event QR check-in
          </h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
            Scan ticket QR or enter the ticket code for paid / free campus events.
          </p>
          <form onSubmit={checkIn} className="flex gap-2">
            <input
              value={checkCode}
              onChange={(e) => setCheckCode(e.target.value)}
              placeholder="Ticket code"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white">
              Check in
            </button>
          </form>
          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
            <OrganizerQrScanner onDecoded={checkInFromScan} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <BarChart3 className="h-5 w-5" /> Per-event breakdown
          </h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {dash.events.map((ev) => (
              <li
                key={ev._id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
              >
                <span className="font-medium text-slate-800 dark:text-slate-100">{ev.title}</span>
                <button
                  type="button"
                  onClick={() => loadAttendees(ev._id)}
                  className="text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Attendees
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {attendees && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Users className="h-5 w-5" /> Live crowd & attendees
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Registered: {attendees.crowd?.registered} · Checked in: {attendees.crowd?.checkedIn} · Live on chat:{' '}
            {attendees.crowd?.liveOnline}
          </p>
          <ul className="space-y-1 text-sm">
            {attendees.data?.map((row) => (
              <li key={row._id} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                <span>{row.user?.name}</span>
                <span className="text-slate-500">{row.ticketCode}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
