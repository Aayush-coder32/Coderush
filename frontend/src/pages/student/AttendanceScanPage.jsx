import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'
import { COLLEGES, BRANCHES, SECTIONS_BY_BRANCH } from '../../constants/attendanceCohort'

function deviceFingerprint() {
  const raw = `${navigator.userAgent}|${screen.width}x${screen.height}`
  let h = 0
  for (let i = 0; i < raw.length; i += 1) h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0
  return `fp_${Math.abs(h).toString(16)}`
}

export default function AttendanceScanPage() {
  const [college, setCollege] = useState('')
  const [branch, setBranch] = useState('')
  const [section, setSection] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [token, setToken] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  const sectionOptions = useMemo(() => {
    if (!branch) return []
    return SECTIONS_BY_BRANCH[branch] || []
  }, [branch])

  const onBranchChange = (b) => {
    setBranch(b)
    setSection('')
  }

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not available')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude))
        setLng(String(pos.coords.longitude))
        toast.success('Location captured')
      },
      () => toast.error('Location denied — geofence may fail')
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!college || !branch || !section) {
      toast.error('Please select college, branch, and section.')
      return
    }
    try {
      const { data } = await client.post('/campus/attendance/mark', {
        sessionId,
        token,
        lat: Number(lat),
        lng: Number(lng),
        deviceFingerprint: deviceFingerprint(),
        college,
        branch,
        section,
      })
      toast.success(data.message || 'Marked')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed'
      toast.error(msg)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mark attendance</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Choose your college, branch, and section. Enter the Session ID and rolling token from the faculty session,
          capture your location with GPS, then submit.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">College & class</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">College</label>
            <select
              required
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select college</option>
              {COLLEGES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Branch</label>
            <select
              required
              value={branch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select branch</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Section / batch</label>
            <select
              required
              disabled={!branch}
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">{branch ? 'Select section' : 'Select branch first'}</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {branch && (branch === 'CSE' || branch === 'CSE-AI/ML') && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                CSE batches: CSE-21, CSE-22, … (choose the year that matches your batch)
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="text-xs text-slate-500">Session ID</label>
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Rolling token</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-500">Lat</label>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Lng</label>
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={locate}
          className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium dark:border-slate-600"
        >
          Use my GPS
        </button>
        <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white">
          Submit attendance
        </button>
      </form>
    </div>
  )
}
