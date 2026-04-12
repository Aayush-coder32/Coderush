import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function ApprovalsPage() {
  const { user } = useAuth()
  const [mine, setMine] = useState([])
  const [pending, setPending] = useState([])
  const [form, setForm] = useState({ type: 'budget', title: '', details: '' })

  const staff = user && ['faculty', 'organizer', 'admin'].includes(user.role)

  const load = async () => {
    const m = await client.get('/campus/approvals/me')
    setMine(m.data.data || [])
    if (staff) {
      const p = await client.get('/campus/approvals/pending')
      setPending(p.data.data || [])
    }
  }

  useEffect(() => {
    if (!user) return undefined
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed')
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await client.post('/campus/approvals', form)
      toast.success('Submitted')
      setForm({ type: 'budget', title: '', details: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const review = async (id, status) => {
    try {
      await client.patch(`/campus/approvals/${id}/review`, { status, comment: '' })
      toast.success('Reviewed')
      load()
    } catch {
      toast.error('Failed')
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Digital approvals</h1>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">New request</h2>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-3 w-full rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
        />
        <textarea
          placeholder="Details"
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          rows={3}
          className="mt-2 w-full rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
        />
        <button type="submit" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
          Submit
        </button>
      </form>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">My requests</h2>
        <ul className="space-y-2 text-sm">
          {mine.map((a) => (
            <li key={a._id} className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
              {a.title} — <span className="text-slate-500">{a.status}</span>
            </li>
          ))}
        </ul>
      </section>

      {staff && (
        <section>
          <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Pending queue</h2>
          <ul className="space-y-3">
            {pending.map((a) => (
              <li key={a._id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-slate-500">{a.type}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{a.details}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => review(a._id, 'approved')} className="rounded bg-emerald-600 px-3 py-1 text-xs text-white">
                    Approve
                  </button>
                  <button type="button" onClick={() => review(a._id, 'rejected')} className="rounded bg-rose-600 px-3 py-1 text-xs text-white">
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
