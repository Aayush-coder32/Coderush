import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState({ title: '', description: '', courseTag: '' })
  const [file, setFile] = useState(null)

  const load = async () => {
    const { data } = await client.get('/campus/notes')
    setNotes(data.data || [])
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load notes')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('courseTag', form.courseTag)
      if (file) fd.append('file', file)
      await client.post('/campus/notes', fd)
      toast.success('Uploaded')
      setForm({ title: '', description: '', courseTag: '' })
      setFile(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notes sharing</h1>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">Upload</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
          <input
            placeholder="Course tag (e.g. CS301)"
            value={form.courseTag}
            onChange={(e) => setForm({ ...form, courseTag: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            rows={2}
          />
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="sm:col-span-2 text-sm" />
        </div>
        <button type="submit" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
          Publish note
        </button>
      </form>

      <ul className="space-y-3">
        {notes.map((n) => (
          <li
            key={n._id}
            id={n._id}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
            <p className="text-sm text-slate-500">{n.courseTag}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{n.description}</p>
            {n.fileUrl && (
              <a
                href={n.fileUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => client.post(`/campus/notes/${n._id}/download`).catch(() => {})}
                className="mt-2 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Open attachment
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
