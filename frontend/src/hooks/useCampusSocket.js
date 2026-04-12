import { useEffect } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:5000' : typeof window !== 'undefined' ? window.location.origin : '')

/**
 * Real-time campus notifications (attendance alerts, notices) via Socket.io.
 */
export function useCampusSocket(user) {
  useEffect(() => {
    if (!user) return undefined
    const token = localStorage.getItem('token')
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
    })

    socket.on('campus_notification', (payload) => {
      toast(payload?.title || 'Campus notification', {
        duration: 5000,
        description: payload?.body || undefined,
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [user])
}
