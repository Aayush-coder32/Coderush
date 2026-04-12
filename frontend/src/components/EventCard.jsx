import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { MapPin, Ticket } from 'lucide-react'

export default function EventCard({ event, reason }) {
  const img = event.image?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'
  const isOnline = /online/i.test(event.location || '') || /^online:/i.test(event.title || '')
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <Link to={`/events/${event._id}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {isOnline && (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-cyan-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Online
            </span>
          )}
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {event.category}
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">{event.title}</h3>
          {reason && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 line-clamp-2">{reason}</p>
          )}
          <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-4 w-4 shrink-0" />
            {event.location}
          </p>
          <div className="flex items-center justify-between pt-1 text-sm">
            <span className="text-slate-600 dark:text-slate-300">
              {event.date ? format(new Date(event.date), 'MMM d, yyyy') : ''}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
              <Ticket className="h-4 w-4" />
              {event.price > 0 ? `₹${event.price}` : 'Free'}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
