import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function ForumPage() {
  const [threads, setThreads] = useState([])
  const [form, setForm] = useState({ title: '', body: '', flair: 'general' })

  const load = async () => {
    const { data } = await client.get('/campus/forum/threads')
    setThreads(data.data || [])
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load forum')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await client.post('/campus/forum/threads', form)
      toast.success('Thread created')
      setForm({ title: '', body: '', flair: 'general' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Campus forum</h1>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">New thread</h2>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        />
        <textarea
          required
          placeholder="Body"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={4}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        />
        <select
          value={form.flair}
          onChange={(e) => setForm({ ...form, flair: e.target.value })}
          className="mt-2 rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
        >
          <option value="general">general</option>
          <option value="academic">academic</option>
          <option value="life">life</option>
        </select>
        <button type="submit" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
          Post
        </button>
      </form>

      <ul className="space-y-2">
        {threads.map((t) => (
          <li key={t._id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Link to={`/forum/${t._id}`} className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              {t.title}
            </Link>
            <p className="text-xs text-slate-500">
              {t.flair} · {t.upvotes}↑ · {t.commentCount} comments
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
