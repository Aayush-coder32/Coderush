import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../lib/api'

export default function CampusMapPage() {
  const [pins, setPins] = useState([])

  useEffect(() => {
    let alive = true
    client
      .get('/campus/map/pins')
      .then(({ data }) => {
        if (alive) setPins(data.data || [])
      })
      .catch(() => {
        if (alive) toast.error('Could not load map')
      })
    return () => {
      alive = false
    }
  }, [])

  if (!pins.length) return <p className="text-slate-500">No pins — run seed script.</p>

  const lats = pins.map((p) => p.lat)
  const lngs = pins.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = Math.max(maxLat - minLat, 1e-6)
  const lngSpan = Math.max(maxLng - minLng, 1e-6)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Smart campus map</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Relative plot of buildings, labs, hostels, and food. GPS coordinates from the API — swap for Mapbox/Google Maps in production.
      </p>
      <div className="relative mx-auto aspect-[16/10] max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-slate-300 dark:text-slate-700" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          {pins.map((p) => {
            const x = ((p.lng - minLng) / lngSpan) * 80 + 10
            const y = (1 - (p.lat - minLat) / latSpan) * 80 + 10
            const colors = {
              building: '#6366f1',
              lab: '#10b981',
              hostel: '#f59e0b',
              food: '#ec4899',
              sports: '#3b82f6',
              other: '#94a3b8',
            }
            return <circle key={p._id} cx={x} cy={y} r="3" fill={colors[p.category] || colors.other} />
          })}
        </svg>
        <ul className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 rounded-xl bg-white/95 p-2 text-xs dark:bg-slate-950/95">
          {pins.map((p) => (
            <li key={p._id} className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
              <span className="font-medium">{p.label}</span>
              <span className="text-slate-500"> · {p.category}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
