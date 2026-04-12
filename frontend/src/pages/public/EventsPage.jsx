import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import client from '../../lib/api'
import EventCard from '../../components/EventCard'

export default function EventsPage() {
  const [params] = useSearchParams()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: params.get('search') || '',
    category: params.get('category') || '',
    sort: params.get('sort') || 'date',
    minPrice: '',
    maxPrice: '',
  })

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await client.get('/events', {
          params: {
            search: filters.search || undefined,
            category: filters.category || undefined,
            sort: filters.sort,
            minPrice: filters.minPrice || undefined,
            maxPrice: filters.maxPrice || undefined,
          },
        })
        setEvents(data.data || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [filters])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Discover events</h1>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2 lg:grid-cols-5">
        <input
          placeholder="Search title or description"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white lg:col-span-2"
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        >
          <option value="">All categories</option>
          <option value="fest">Fest</option>
          <option value="workshop">Workshop</option>
          <option value="seminar">Seminar</option>
          <option value="competition">Competition</option>
          <option value="other">Other</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        >
          <option value="date">Date</option>
          <option value="popularity">Popularity</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading events…</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e._id} event={e} />
          ))}
        </div>
      )}
      {!loading && events.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">No events match your filters.</p>
      )}
    </div>
  )
}
