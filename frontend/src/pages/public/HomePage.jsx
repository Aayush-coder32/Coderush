import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../../lib/api'
import EventCard from '../../components/EventCard'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowRight,
  Wand2,
  Sparkles,
  QrCode,
  Cpu,
  Library,
  MessageSquare,
  Shield,
  Zap,
  MapPinned,
  BarChart3,
  ChevronRight,
  GraduationCap,
  Ticket,
  Radio,
} from 'lucide-react'

const FEATURES = [
  {
    title: 'Events & tickets',
    desc: 'Browse campus events, book seats, and get a scannable ticket QR.',
    href: '/events',
    icon: Ticket,
    span: 'sm:col-span-2',
    gradient: 'from-violet-600 to-indigo-700',
  },
  {
    title: 'QR attendance',
    desc: 'Rolling tokens + geofence-friendly marks tied to your cohort.',
    href: '/dashboard',
    icon: QrCode,
    span: 'sm:col-span-1',
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    title: 'Campus Brain',
    desc: 'Ask the AI assistant about schedules, policies, and campus life.',
    href: '/brain',
    icon: Cpu,
    span: 'sm:col-span-1',
    gradient: 'from-sky-600 to-blue-700',
  },
  {
    title: 'Resources & map',
    desc: 'Book labs and library slots; explore the interactive campus map.',
    href: '/resources',
    icon: Library,
    span: 'sm:col-span-1',
    gradient: 'from-amber-600 to-orange-700',
  },
  {
    title: 'Forums & peers',
    desc: 'Threads, lost & found, complaints — stay connected after class.',
    href: '/forum',
    icon: MessageSquare,
    span: 'sm:col-span-1',
    gradient: 'from-fuchsia-600 to-pink-700',
  },
  {
    title: 'Insights',
    desc: 'Dashboards for students, faculty workflows, and admin analytics.',
    href: '/dashboard',
    icon: BarChart3,
    span: 'sm:col-span-2 lg:col-span-1',
    gradient: 'from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800',
  },
]

const STEPS = [
  { step: '01', title: 'Sign up', body: 'Create a student or faculty account in seconds.' },
  { step: '02', title: 'Explore', body: 'Events, attendance, resources, and AI — one campus OS.' },
  { step: '03', title: 'Go live', body: 'Book tickets, mark attendance, and collaborate in real time.' },
]

export default function HomePage() {
  const { user } = useAuth()
  const [trending, setTrending] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [catalogCount, setCatalogCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reco, setReco] = useState([])
  const [recoMeta, setRecoMeta] = useState({ usedOpenAI: false })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [t, u, catalog] = await Promise.all([
          client.get('/events/trending'),
          client.get('/events/upcoming'),
          client.get('/events', { params: { sort: 'date' } }),
        ])
        if (cancelled) return
        setTrending(t.data.data || [])
        setUpcoming(u.data.data || [])
        const raw = catalog.data?.data
        setCatalogCount(
          typeof catalog.data?.count === 'number' ? catalog.data.count : Array.isArray(raw) ? raw.length : null
        )
      } catch {
        if (!cancelled) {
          setTrending([])
          setUpcoming([])
          setCatalogCount(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await client.get('/recommendations')
        if (cancelled) return
        setReco(data.data || [])
        setRecoMeta({ usedOpenAI: data.usedOpenAI })
      } catch {
        /* optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const upcomingSoon = upcoming.slice(0, 6)

  return (
    <div className="space-y-16 pb-8 md:space-y-24 md:pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl dark:border-slate-800/80">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.45), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(168,85,247,0.35), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(236,72,153,0.25), transparent)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,black,transparent)]" />

        <div className="relative z-10 grid gap-10 px-6 py-14 md:grid-cols-2 md:gap-12 md:px-10 md:py-16 lg:py-20">
          <div className="flex flex-col justify-center space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur">
              <Radio className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
              Live campus stack
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-[3.25rem]">
              The operating system for your{' '}
              <span className="bg-gradient-to-r from-amber-200 via-white to-violet-200 bg-clip-text text-transparent">
                smart campus
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/80">
              Attendance with QR and geofencing, resource booking, campus map, forums, payments, and an AI campus
              brain — unified for students, faculty, and admins.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-indigo-900 shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-50"
              >
                Explore events
                <ArrowRight className="h-4 w-4" />
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Open dashboard
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Create free account
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <dl className="grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-8">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Catalog</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-white">
                  {loading ? '—' : catalogCount ?? '—'}
                </dd>
                <dd className="text-xs text-white/55">published events</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Trending</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{loading ? '—' : trending.length}</dd>
                <dd className="text-xs text-white/55">hot picks now</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Upcoming</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{loading ? '—' : upcoming.length}</dd>
                <dd className="text-xs text-white/55">scheduled ahead</dd>
              </div>
            </dl>
          </div>

          {/* Decorative preview */}
          <div className="relative flex min-h-[280px] items-center justify-center md:min-h-[320px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-full bg-violet-500/20 blur-3xl md:h-64 md:w-64" />
              <div className="absolute h-40 w-40 rounded-full bg-cyan-500/15 blur-2xl md:h-52 md:w-52" />
            </div>
            <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.07] p-1 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 rounded-t-xl border-b border-white/10 bg-black/20 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
                <span className="ml-2 flex-1 truncate text-center text-[10px] font-medium text-white/40">
                  campus.smart / dashboard
                </span>
              </div>
              <div className="space-y-3 p-4 text-left">
                <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/80">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Today&apos;s pulse</p>
                      <p className="text-[10px] text-white/50">Attendance · Events · AI</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                    Live
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                    <p className="text-[10px] uppercase tracking-wide text-white/45">Next event</p>
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-white/90">
                      {upcomingSoon[0]?.title || 'Coderush & campus meets'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                    <p className="text-[10px] uppercase tracking-wide text-white/45">Stack</p>
                    <p className="mt-1 text-xs font-medium text-white/90">React · Node · MongoDB</p>
                  </div>
                </div>
                <div className="flex gap-2 rounded-lg bg-black/25 p-2 ring-1 ring-white/10">
                  <div className="h-14 flex-1 rounded bg-gradient-to-br from-indigo-500/40 to-violet-600/30" />
                  <div className="h-14 flex-1 rounded bg-gradient-to-br from-emerald-500/30 to-teal-600/25" />
                  <div className="h-14 flex-1 rounded bg-gradient-to-br from-amber-500/30 to-orange-600/25" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-slate-200/80 py-6 dark:border-slate-800/80">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Role-based access
        </span>
        <span className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-600" />
        <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          <MapPinned className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Geofence-ready attendance
        </span>
        <span className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-600" />
        <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          AI-assisted discovery
        </span>
      </section>

      {/* Bento features */}
      <section>
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Platform
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Everything students expect — built for one campus login.
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Pick a module; protected areas send guests to sign-in automatically.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, desc, href, icon: Icon, span, gradient }) => (
            <Link
              key={title}
              to={href}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${span}`}
            >
              <div
                className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition group-hover:opacity-30 ${gradient}`}
              />
              <div
                className={`mb-4 inline-flex rounded-xl bg-gradient-to-br p-3 text-white shadow-lg ${gradient}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-2 dark:text-indigo-400">
                Open
                <ChevronRight className="h-4 w-4 transition-all group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-12 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 md:px-10 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">How it works</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Three steps from landing to a live ticket or attendance mark.</p>
        </div>
        <ol className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ step, title, body }) => (
            <li
              key={step}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 text-left dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="font-mono text-3xl font-bold text-indigo-200 dark:text-indigo-900/80">{step}</span>
              <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Mid CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-12 text-center md:px-12 md:py-14">
        <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10 mx-auto max-w-2xl space-y-4">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Ready when your campus is.</h2>
          <p className="text-indigo-100">
            Browse public events without an account, or sign in to unlock attendance, Brain, resources, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-lg hover:bg-indigo-50"
            >
              <Zap className="h-4 w-4" />
              Browse events
            </Link>
            {!user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Recommendations */}
      {user && reco.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
              <Wand2 className="h-7 w-7 shrink-0 text-violet-500" />
              Recommended for you
            </h2>
            {recoMeta.usedOpenAI && (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                AI-powered blurbs
              </span>
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reco.map((e) => (
              <EventCard key={e._id} event={e} reason={e.recommendationReason} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Trending on campus</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Highest momentum by bookings and buzz.</p>
          </div>
          <Link
            to="/events?sort=popularity"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            See all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
              />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
            No trending events yet — check back after the next campus drop.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((e) => (
              <EventCard key={e._id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Upcoming</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Chronological — plan your week on campus.</p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Filters & search
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
              />
            ))}
          </div>
        ) : upcomingSoon.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
            No upcoming dates in the catalog — faculty can publish new events anytime.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingSoon.map((e) => (
              <EventCard key={e._id} event={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
