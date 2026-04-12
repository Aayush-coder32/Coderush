import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function ForumThreadPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [body, setBody] = useState('')

  const load = async () => {
    const { data: res } = await client.get(`/campus/forum/threads/${id}`)
    setData(res.data)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load thread')
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  const comment = async (e) => {
    e.preventDefault()
    try {
      await client.post(`/campus/forum/threads/${id}/comments`, { body })
      setBody('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const upvote = async () => {
    try {
      await client.post(`/campus/forum/threads/${id}/upvote`)
      load()
    } catch {
      toast.error('Upvote failed')
    }
  }

  if (!data) return <p className="text-slate-500">Loading…</p>

  const { thread, comments } = data

  return (
    <div className="space-y-6">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{thread.title}</h1>
        <p className="mt-2 text-sm text-slate-500">by {thread.author?.name}</p>
        <p className="mt-4 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{thread.body}</p>
        <button type="button" onClick={upvote} className="mt-4 rounded-lg bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800">
          Upvote ({thread.upvotes})
        </button>
      </article>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Comments</h2>
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c._id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs text-slate-500">{c.author?.name}</p>
              <p className="text-sm text-slate-800 dark:text-slate-200">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={comment} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          placeholder="Reply…"
        />
        <button type="submit" className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Comment
        </button>
      </form>
    </div>
  )
}
