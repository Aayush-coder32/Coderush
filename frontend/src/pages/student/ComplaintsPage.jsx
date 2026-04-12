import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function ComplaintsPage() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [form, setForm] = useState({ category: 'facilities', subject: '', body: '' })

  const load = async () => {
    if (user?.role === 'admin') {
      const { data } = await client.get('/campus/complaints/all')
      setList(data.data || [])
    } else {
      const { data } = await client.get('/campus/complaints/me')
      setList(data.data || [])
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
      await client.post('/campus/complaints', form)
      toast.success('Logged')
      setForm({ category: 'facilities', subject: '', body: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const update = async (id, status) => {
    try {
      await client.patch(`/campus/complaints/${id}`, { status })
      toast.success('Updated')
      load()
    } catch {
      toast.error('Failed')
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Complaints</h1>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">Submit</h2>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="mt-3 w-full rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
        >
          <option value="facilities">facilities</option>
          <option value="hostel">hostel</option>
          <option value="academic">academic</option>
          <option value="other">other</option>
        </select>
        <input
          required
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="mt-2 w-full rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
        />
        <textarea
          required
          placeholder="Details"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={4}
          className="mt-2 w-full rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
        />
        <button type="submit" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
          Submit
        </button>
      </form>

      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c._id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="font-medium text-slate-900 dark:text-white">{c.subject}</p>
            <p className="text-xs text-slate-500">{c.category} · {c.status}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.body}</p>
            {user?.role === 'admin' && (
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => update(c._id, 'in_progress')} className="text-xs text-amber-600">
                  In progress
                </button>
                <button type="button" onClick={() => update(c._id, 'resolved')} className="text-xs text-emerald-600">
                  Resolve
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
