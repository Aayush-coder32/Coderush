import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import client from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { COLLEGES } from '../../constants/attendanceCohort'

export default function ResourcesPage() {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [myLoans, setMyLoans] = useState([])
  const [bookForm, setBookForm] = useState({ resourceId: '', startAt: '', endAt: '', purpose: '' })
  const [issueForm, setIssueForm] = useState({ resourceId: '', userId: '', days: 14 })
  const [libForm, setLibForm] = useState({
    collegeName: '',
    registrationNumber: '',
    subjectTitle: '',
    issueDate: '',
    endDate: '',
  })
  const [libSaving, setLibSaving] = useState(false)

  const load = async () => {
    const { data } = await client.get('/campus/resources')
    setResources(data.data || [])
  }

  const loadLoans = async () => {
    try {
      const { data } = await client.get('/campus/library/my-loans')
      setMyLoans(data.data || [])
    } catch {
      setMyLoans([])
    }
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
        if (alive && user) await loadLoans()
      } catch {
        if (alive) toast.error('Failed to load resources')
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  const staff = user && ['faculty', 'organizer', 'admin'].includes(user.role)

  const book = async (e) => {
    e.preventDefault()
    try {
      await client.post('/campus/resource-bookings', {
        resourceId: bookForm.resourceId,
        startAt: bookForm.startAt,
        endAt: bookForm.endAt,
        purpose: bookForm.purpose,
      })
      toast.success('Room booked')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    }
  }

  const issue = async (e) => {
    e.preventDefault()
    try {
      await client.post('/campus/library/issue', issueForm)
      toast.success('Book issued')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Issue failed')
    }
  }

  const borrowLibrarySelf = async (e) => {
    e.preventDefault()
    if (!libForm.collegeName) {
      toast.error('Select college')
      return
    }
    if (!libForm.issueDate) {
      toast.error('Select issue date')
      return
    }
    if (!libForm.endDate) {
      toast.error('Select end date')
      return
    }
    setLibSaving(true)
    try {
      await client.post('/campus/library/borrow-self', {
        collegeName: libForm.collegeName,
        registrationNumber: libForm.registrationNumber.trim(),
        subjectTitle: libForm.subjectTitle.trim(),
        issueDate: libForm.issueDate,
        endDate: libForm.endDate,
      })
      toast.success('Library borrow recorded')
      setLibForm((f) => ({
        ...f,
        registrationNumber: '',
        subjectTitle: '',
        issueDate: '',
        endDate: '',
      }))
      await loadLoans()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not save')
    } finally {
      setLibSaving(false)
    }
  }

  const rooms = resources.filter((r) => r.type === 'room')
  const books = resources.filter((r) => r.type === 'book')
  const labs = resources.filter((r) => r.type === 'lab_equipment')

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Intelligent resources</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold text-slate-900 dark:text-white">Rooms</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {rooms.map((r) => (
              <li key={r._id} className="flex justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <span>{r.name}</span>
                <span className="text-slate-500">{r.location}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold text-slate-900 dark:text-white">Library</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {books.map((r) => (
              <li key={r._id} className="flex justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                <span>{r.name}</span>
                <span className="text-slate-500">{r.availableCopies}/{r.totalCopies}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold text-slate-900 dark:text-white">Lab assets</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {labs.map((r) => (
              <li key={r._id} className="border-b border-slate-100 pb-2 dark:border-slate-800">
                {r.name} · {r.status}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {user && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Library — borrow a book</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Select college, registration number, book subject, <strong>issue date</strong>, and <strong>end date</strong> (return by).
          </p>
          <form onSubmit={borrowLibrarySelf} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">College</label>
              <select
                required
                value={libForm.collegeName}
                onChange={(e) => setLibForm({ ...libForm, collegeName: e.target.value })}
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
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Registration number</label>
              <input
                required
                value={libForm.registrationNumber}
                onChange={(e) => setLibForm({ ...libForm, registrationNumber: e.target.value })}
                placeholder="e.g. 2021CS001"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Subject / name of book</label>
              <input
                required
                value={libForm.subjectTitle}
                onChange={(e) => setLibForm({ ...libForm, subjectTitle: e.target.value })}
                placeholder="e.g. Data Structures"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Issue date</label>
              <input
                type="date"
                required
                value={libForm.issueDate}
                onChange={(e) => {
                  const next = e.target.value
                  setLibForm((f) => ({
                    ...f,
                    issueDate: next,
                    endDate: f.endDate && next && f.endDate < next ? '' : f.endDate,
                  }))
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">End date (return by)</label>
              <input
                type="date"
                required
                value={libForm.endDate}
                min={libForm.issueDate || undefined}
                onChange={(e) => setLibForm({ ...libForm, endDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={libSaving}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {libSaving ? 'Saving…' : 'Submit library borrow'}
              </button>
            </div>
          </form>

          {myLoans.length > 0 && (
            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Your active borrows</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {myLoans.map((loan) => (
                  <li
                    key={loan._id}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">
                      {loan.subjectTitle || loan.resource?.name || 'Book'}
                    </span>
                    {(loan.collegeName || loan.registrationNumber) && (
                      <span className="block text-slate-600 dark:text-slate-400">
                        {loan.collegeName}
                        {loan.registrationNumber ? ` · Reg: ${loan.registrationNumber}` : ''}
                      </span>
                    )}
                    <span className="block text-xs text-slate-500">
                      Due {loan.dueAt ? format(new Date(loan.dueAt), 'MMM d, yyyy') : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <form onSubmit={book} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">Book a room / lab slot</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            value={bookForm.resourceId}
            onChange={(e) => setBookForm({ ...bookForm, resourceId: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            required
          >
            <option value="">Select room</option>
            {rooms.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            required
            value={bookForm.startAt}
            onChange={(e) => setBookForm({ ...bookForm, startAt: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
          <input
            type="datetime-local"
            required
            value={bookForm.endAt}
            onChange={(e) => setBookForm({ ...bookForm, endAt: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
          <input
            placeholder="Purpose"
            value={bookForm.purpose}
            onChange={(e) => setBookForm({ ...bookForm, purpose: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <button type="submit" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
          Confirm booking
        </button>
      </form>

      {staff && (
        <form onSubmit={issue} className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-6 dark:border-indigo-800 dark:bg-indigo-950/20">
          <h2 className="font-semibold text-indigo-900 dark:text-indigo-100">Faculty: issue library copy</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <select
              value={issueForm.resourceId}
              onChange={(e) => setIssueForm({ ...issueForm, resourceId: e.target.value })}
              className="rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
              required
            >
              <option value="">Book</option>
              {books.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Student user Mongo ID"
              value={issueForm.userId}
              onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
              className="rounded-lg border px-3 py-2 font-mono text-sm dark:bg-slate-950 dark:text-white"
              required
            />
            <input
              type="number"
              placeholder="Days until due"
              value={issueForm.days}
              onChange={(e) => setIssueForm({ ...issueForm, days: e.target.value })}
              className="rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <button type="submit" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Issue
          </button>
        </form>
      )}
    </div>
  )
}
