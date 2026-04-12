import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { Send } from 'lucide-react'

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:5000' : typeof window !== 'undefined' ? window.location.origin : '')

/**
 * Real-time attendee chat (Socket.io). Reuses one socket connection per mount.
 */
export default function EventChat({ eventId, userName, token }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.emit('join_event', { eventId, userName: userName || 'Guest' })

    socket.on('chat_history', (hist) => setMessages(hist || []))
    socket.on('chat_message', (msg) => {
      setMessages((m) => [...m, msg])
    })

    return () => {
      socket.emit('leave_event', { eventId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [eventId, userName, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!text.trim() || !token || !socketRef.current) return
    socketRef.current.emit('chat_message', { eventId, message: text })
    setText('')
  }

  return (
    <div className="flex h-80 flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Attendee chat</span>
        <span className={`text-xs font-medium ${connected ? 'text-emerald-600' : 'text-amber-600'}`}>
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {messages.map((m) => (
          <div key={m._id} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {m.user?.name || m.userName}
            </p>
            <p className="text-slate-700 dark:text-slate-200">{m.message}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-slate-100 p-2 dark:border-slate-800">
        <input
          value={text}
          disabled={!token}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={token ? 'Say hi to other attendees…' : 'Sign in to chat'}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        />
        <button
          type="button"
          onClick={send}
          disabled={!token}
          className="rounded-lg bg-indigo-600 p-2 text-white disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
