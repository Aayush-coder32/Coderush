import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import client from '../../lib/api'
import EventCard from '../../components/EventCard'
import { Sparkles, Send } from 'lucide-react'

export default function BrainPage() {
  const [feed, setFeed] = useState(null)
  const [risks, setRisks] = useState([])
  const [slots, setSlots] = useState(null)
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Ask me about campus services, attendance, or events.' }])
  const [input, setInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [f, r, s] = await Promise.all([
          client.get('/campus/ai/brain-feed'),
          client.get('/campus/ai/attendance-prediction').catch(() => ({ data: { data: [] } })),
          client.get('/campus/resources/suggest-slots').catch(() => ({ data: {} })),
        ])
        if (!alive) return
        setFeed(f.data)
        setRisks(r.data?.data || [])
        setSlots(s.data)
      } catch {
        if (alive) toast.error('Could not load AI Campus Brain')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const sendChat = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const next = [...messages, { role: 'user', content: input.trim() }]
    setMessages(next)
    setInput('')
    setChatBusy(true)
    try {
      const { data } = await client.post('/campus/ai/chat', {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
      })
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch {
      toast.error('Chat failed')
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <Sparkles className="h-8 w-8 text-amber-500" /> AI Campus Brain
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            Personalized events, notes, library picks, lab-time hints, attendance risk, and an assistant chatbot.
          </p>
        </div>
        <Link
          to="/resources"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-indigo-600"
        >
          Resource hub
        </Link>
      </div>

      {feed?.narrative && (
        <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-6 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">AI summary</h2>
          <p className="mt-2 text-slate-800 dark:text-slate-100">{feed.narrative}</p>
        </section>
      )}

      {risks.length > 0 && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 dark:border-rose-900 dark:bg-rose-950/30">
          <h2 className="font-semibold text-rose-900 dark:text-rose-100">Attendance intelligence</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {risks.map((r) => (
              <li key={r.courseCode} className="rounded-lg bg-white/80 px-3 py-2 dark:bg-slate-900/80">
                <span className="font-mono font-bold">{r.courseCode}</span> — {r.attendanceRate}% · {r.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {slots?.data?.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold text-slate-900 dark:text-white">Lab / room — low-crowd windows</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{slots.aiSummary}</p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Events you may like</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(feed?.events || []).map((ev) => (
            <div key={ev._id}>
              <EventCard event={ev} />
              {ev.recommendationReason && (
                <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">{ev.recommendationReason}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Notes for you</h2>
          <ul className="space-y-2 text-sm">
            {(feed?.notes || []).map((n) => (
              <li key={n._id}>
                <Link to={`/notes#${n._id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                  {n.title}
                </Link>
                <span className="text-slate-500"> · {n.courseTag}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Library spotlight</h2>
          <ul className="space-y-2 text-sm">
            {(feed?.books || []).map((b) => (
              <li key={b._id} className="flex justify-between gap-2">
                <span>{b.name}</span>
                <span className="text-slate-500">{b.availableCopies} left</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Campus assistant (chat)</h2>
        <div className="mb-4 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
          {messages.map((m, i) => (
            <p key={i} className={m.role === 'user' ? 'text-right text-indigo-600' : 'text-slate-700 dark:text-slate-300'}>
              <span className="font-medium">{m.role === 'user' ? 'You' : 'AI'}: </span>
              {m.content}
            </p>
          ))}
        </div>
        <form onSubmit={sendChat} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about Smart Campus OS…"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />
          <button
            type="submit"
            disabled={chatBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </form>
      </section>
    </div>
  )
}
