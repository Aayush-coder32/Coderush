import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function LostFoundPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ kind: 'lost', title: '', description: '', locationHint: '' })
  const [img, setImg] = useState(null)

  const load = async () => {
    const { data } = await client.get('/campus/lost-found?status=open')
    setItems(data.data || [])
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load')
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
      fd.append('kind', form.kind)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('locationHint', form.locationHint)
      if (img) fd.append('image', img)
      await client.post('/campus/lost-found', fd)
      toast.success('Posted')
      setForm({ kind: 'lost', title: '', description: '', locationHint: '' })
      setImg(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const claim = async (id) => {
    try {
      await client.post(`/campus/lost-found/${id}/claim`)
      toast.success('Claim recorded — coordinate offline')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Lost & found</h1>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className="rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
          />
          <input
            placeholder="Location hint"
            value={form.locationHint}
            onChange={(e) => setForm({ ...form, locationHint: e.target.value })}
            className="sm:col-span-2 rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="sm:col-span-2 rounded-lg border px-3 py-2 dark:bg-slate-950 dark:text-white"
            rows={2}
          />
          <input type="file" accept="image/*" onChange={(e) => setImg(e.target.files?.[0] || null)} className="sm:col-span-2" />
        </div>
        <button type="submit" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
          Post
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold uppercase text-indigo-600">{it.kind}</span>
            <h3 className="font-semibold text-slate-900 dark:text-white">{it.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{it.description}</p>
            {it.imageUrl && <img src={it.imageUrl} alt="" className="mt-2 max-h-40 rounded-lg object-cover" />}
            <button
              type="button"
              onClick={() => claim(it._id)}
              className="mt-3 rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white"
            >
              Claim / I have info
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
