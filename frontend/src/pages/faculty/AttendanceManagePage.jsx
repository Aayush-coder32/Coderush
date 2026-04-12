import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function AttendanceManagePage() {
  const [sessions, setSessions] = useState([])
  const [form, setForm] = useState({
    courseCode: '',
    title: '',
    lat: '28.6139',
    lng: '77.209',
    geoRadiusMeters: 120,
    startsAt: '',
    endsAt: '',
  })
  const [qrSessionId, setQrSessionId] = useState(null)
  const [qrImg, setQrImg] = useState('')

  const load = useCallback(async () => {
    const { data } = await client.get('/campus/attendance/sessions')
    setSessions(data.data || [])
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load sessions')
      }
    })()
    return () => {
      alive = false
    }
  }, [load])

  const createSession = async (e) => {
    e.preventDefault()
    try {
      await client.post('/campus/attendance/sessions', {
        courseCode: form.courseCode,
        title: form.title,
        geoCenter: { lat: Number(form.lat), lng: Number(form.lng) },
        geoRadiusMeters: Number(form.geoRadiusMeters),
        startsAt: form.startsAt,
        endsAt: form.endsAt,
      })
      toast.success('Session created')
      setForm((f) => ({ ...f, courseCode: '', title: '' }))
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create')
    }
  }

  const refreshQr = useCallback(async () => {
    if (!qrSessionId) return
    try {
      const { data } = await client.get(`/campus/attendance/sessions/${qrSessionId}/qr`)
      setQrImg(data.dataUrl)
    } catch {
      toast.error('QR refresh failed')
    }
  }, [qrSessionId])

  useEffect(() => {
    if (!qrSessionId) return undefined
    const tick = async () => {
      await refreshQr()
    }
    void tick()
    const t = setInterval(() => void tick(), 25000)
    return () => clearInterval(t)
  }, [qrSessionId, refreshQr])

  const analytics = async (id) => {
    try {
      const { data } = await client.get(`/campus/attendance/sessions/${id}/analytics`)
      toast.success(`${data.count} students marked`)
    } catch {
      toast.error('Could not load analytics')
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Smart attendance</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Rolling QR (~30s), geofence, and device fingerprinting reduce proxy check-ins. Project this QR in class.
      </p>

      <form
        onSubmit={createSession}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-500">Course code</label>
          <input
            required
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            placeholder="CS301"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-500">Session title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Latitude</label>
          <input
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Longitude</label>
          <input
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Radius (m)</label>
          <input
            type="number"
            value={form.geoRadiusMeters}
            onChange={(e) => setForm({ ...form, geoRadiusMeters: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Starts at (local)</label>
          <input
            type="datetime-local"
            required
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Ends at</label>
          <input
            type="datetime-local"
            required
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
            Create session
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Your sessions</h2>
        <ul className="space-y-3 text-sm">
          {sessions.map((s) => (
            <li
              key={s._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"
            >
              <div>
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{s.courseCode}</span>{' '}
                <span className="text-slate-700 dark:text-slate-200">{s.title}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQrSessionId(s._id)}
                  className="rounded-lg bg-slate-900 px-3 py-1 text-white dark:bg-indigo-600"
                >
                  Show QR
                </button>
                <button type="button" onClick={() => analytics(s._id)} className="rounded-lg border px-3 py-1">
                  Analytics
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {qrSessionId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">Live dynamic QR</h3>
          {qrImg ? <img src={qrImg} alt="Attendance QR" className="mx-auto rounded-xl border" /> : <p>Loading…</p>}
          <button type="button" onClick={refreshQr} className="mt-4 text-sm text-indigo-600 hover:underline">
            Refresh now
          </button>
        </div>
      )}
    </div>
  )
}
