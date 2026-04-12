import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import client from '../../lib/api'
import EventCard from '../../components/EventCard'
import { Bell, Sparkles } from 'lucide-react'

export default function StudentDashboardPage() {
  const [bookings, setBookings] = useState([])
  const [saved, setSaved] = useState([])
  const [notifs, setNotifs] = useState([])
  const [attSummary, setAttSummary] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [b, s, n, att] = await Promise.all([
          client.get('/bookings/mine'),
          client.get('/bookmarks'),
          client.get('/notifications/in-app'),
          client.get('/campus/attendance/me').catch(() => ({ data: { summaryByCourse: {} } })),
        ])
        if (!alive) return
        setBookings(b.data.data || [])
        setSaved(s.data.data || [])
        setNotifs(n.data.data || [])
        const by = att.data?.summaryByCourse || {}
        setAttSummary(Object.entries(by).map(([name, v]) => ({ name, attended: v.attended })))
      } catch {
        if (alive) toast.error('Failed to load dashboard')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your dashboard</h1>
        <Link
          to="/brain"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
        >
          <Sparkles className="h-4 w-4" /> AI Campus Brain
        </Link>
      </div>

      {attSummary.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Attendance by course (sessions marked)</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attSummary}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="attended" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Bell className="h-5 w-5 text-indigo-500" /> In-app notifications
        </h2>
        <ul className="space-y-2">
          {notifs.map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
              <p className="font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
              <p className="text-slate-600 dark:text-slate-300">{n.body}</p>
            </li>
          ))}
          {notifs.length === 0 && <p className="text-sm text-slate-500">No upcoming reminders.</p>}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">My bookings</h2>
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b._id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div>
                <Link
                  to={`/events/${b.event?._id}`}
                  className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {b.event?.title || 'Event'}
                </Link>
                <p className="text-sm text-slate-500">
                  {b.event?.date ? format(new Date(b.event.date), 'PPP') : ''} · {b.status} · {b.ticketCode}
                </p>
              </div>
              {b.status === 'confirmed' && b.qrPayload && (
                <img src={b.qrPayload} alt="QR" className="h-24 w-24 rounded border" />
              )}
            </div>
          ))}
          {bookings.length === 0 && <p className="text-slate-500">No bookings yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Saved events</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((e) => (
            <EventCard key={e._id} event={e} />
          ))}
        </div>
        {saved.length === 0 && <p className="text-slate-500">Bookmark events from the detail page.</p>}
      </section>
    </div>
  )
}
