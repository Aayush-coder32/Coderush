import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'
import { HOSTEL_NAMES, ROOM_NUMBERS as roomOptions } from '../../constants/hostels'
import { COLLEGES, BRANCHES } from '../../constants/attendanceCohort'

function defaultAcademicYear() {
  const y = new Date().getFullYear()
  return `${y}-${String(y + 1).slice(-2)}`
}

export default function HostelPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [hostelName, setHostelName] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [studentName, setStudentName] = useState('')
  const [mobile, setMobile] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [branch, setBranch] = useState('')
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await client.get('/campus/hostel/me')
      setRows(data.data || [])
    } catch {
      toast.error('Failed to load hostel')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!hostelName) {
      toast.error('Select a hostel')
      return
    }
    if (!roomNumber) {
      toast.error('Select room number')
      return
    }
    setSaving(true)
    try {
      await client.post('/campus/hostel/allocate-self', {
        hostelName,
        roomNumber: Number(roomNumber),
        studentName: studentName.trim(),
        mobile: mobile.trim(),
        collegeName,
        branch,
        academicYear: academicYear.trim() || defaultAcademicYear(),
      })
      toast.success('Hostel allocation saved')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hostel allocation</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Choose your hostel, then room (1–300), and submit your details.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Allocation form</h2>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Name of hostel</label>
          <select
            required
            value={hostelName}
            onChange={(e) => {
              setHostelName(e.target.value)
              setRoomNumber('')
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Select hostel</option>
            {HOSTEL_NAMES.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {hostelName && (
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Room no. (1–300)</label>
            <select
              required
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select room</option>
              {roomOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Student name</label>
          <input
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Full name as on ID"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Mobile no.</label>
          <input
            required
            type="tel"
            inputMode="numeric"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit mobile"
            maxLength={15}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">College name</label>
          <select
            required
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
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
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Branch</label>
          <select
            required
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
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
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Academic year</label>
          <input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g. 2025-26"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !hostelName}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Submit allocation'}
        </button>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Your record</h2>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No allocation on file yet. Submit the form above.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {r.hostelName || r.block} · Room {r.roomNumber}
                  {r.bedNumber ? ` · Bed ${r.bedNumber}` : ''}
                </p>
                {(r.residentName || r.mobile || r.collegeName || r.branch) && (
                  <dl className="mt-2 grid gap-1 text-sm text-slate-600 dark:text-slate-300">
                    {r.residentName && (
                      <div>
                        <dt className="inline font-medium text-slate-500">Student: </dt>
                        <dd className="inline">{r.residentName}</dd>
                      </div>
                    )}
                    {r.mobile && (
                      <div>
                        <dt className="inline font-medium text-slate-500">Mobile: </dt>
                        <dd className="inline">{r.mobile}</dd>
                      </div>
                    )}
                    {r.collegeName && (
                      <div>
                        <dt className="inline font-medium text-slate-500">College: </dt>
                        <dd className="inline">{r.collegeName}</dd>
                      </div>
                    )}
                    {r.branch && (
                      <div>
                        <dt className="inline font-medium text-slate-500">Branch: </dt>
                        <dd className="inline">{r.branch}</dd>
                      </div>
                    )}
                  </dl>
                )}
                <p className="mt-2 text-xs text-slate-500">Year {r.academicYear}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
