import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function PeersPage() {
  const [peers, setPeers] = useState([])
  const [skill, setSkill] = useState('')

  const load = async () => {
    const { data } = await client.get('/campus/peers', { params: { skill: skill || undefined } })
    setPeers(data.data || [])
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load directory')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const search = (e) => {
    e.preventDefault()
    load().catch(() => {})
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Peer network</h1>
      <form onSubmit={search} className="flex gap-2">
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Filter by skill"
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        />
        <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
          Search
        </button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        {peers.map((p) => (
          <div key={p._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
            <p className="text-sm text-slate-500">{p.department}</p>
            <p className="text-xs text-slate-400">{p.studentRoll}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{p.bio}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(p.skills || []).map((s) => (
                <span key={s} className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
