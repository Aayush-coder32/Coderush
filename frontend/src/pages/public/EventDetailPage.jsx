import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import client from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import EventChat from '../../components/EventChat'
import { Bookmark, MapPin, Ticket, Users, Radio, Star, X } from 'lucide-react'

export default function EventDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null

  const [data, setData] = useState(null)
  const [reviews, setReviews] = useState([])
  const [avg, setAvg] = useState({ average: 0, count: 0 })
  const [bookmarked, setBookmarked] = useState(false)
  const [booking, setBooking] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [payBusy, setPayBusy] = useState(false)
  const [payQrModalOpen, setPayQrModalOpen] = useState(false)

  const load = async () => {
    const res = await client.get(`/events/${id}`)
    setData(res.data.data)
    setReviews(res.data.reviews || [])
    setAvg(res.data.ratingSummary || { average: 0, count: 0 })
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await load()
      } catch {
        if (alive) toast.error('Failed to load event')
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!user) return
    client
      .get(`/bookmarks/status/${id}`)
      .then((r) => setBookmarked(r.data.bookmarked))
      .catch(() => {})
    client
      .get('/bookings/mine')
      .then((r) => {
        const mine = (r.data.data || []).find((b) => String(b.event?._id || b.event) === String(id))
        if (mine) setBooking(mine)
      })
      .catch(() => {})
  }, [user, id])

  const toggleBookmark = async () => {
    if (!user) return toast.error('Sign in to bookmark')
    const { data } = await client.post('/bookmarks/toggle', { eventId: id })
    setBookmarked(data.bookmarked)
    toast.success(data.bookmarked ? 'Saved' : 'Removed from saved')
  }

  const book = async () => {
    if (!user) return toast.error('Sign in to book')
    try {
      const { data } = await client.post('/bookings', { eventId: id })
      setBooking(data.data)
      if (data.needsPayment) {
        toast('Complete payment', { icon: '💳' })
        return
      }
      toast.success(data.message || 'Booked!')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Booking failed')
    }
  }

  /** Pending booking id for this event (state can be stale after refresh). */
  const resolvePendingBookingId = async () => {
    const fromState = booking?.status === 'pending' ? booking._id || booking.id : null
    if (fromState) return String(fromState)
    try {
      const { data } = await client.get('/bookings/mine')
      const mine = (data.data || []).find((b) => String(b.event?._id || b.event) === String(id))
      if (mine?.status === 'pending') {
        setBooking(mine)
        return String(mine._id || mine.id)
      }
    } catch {
      /* ignore */
    }
    return null
  }

  const paymentErrorMessage = (e, fallback) =>
    e.response?.data?.message ||
    (e.code === 'ERR_NETWORK'
      ? 'API not reachable (port 5000). In another terminal: cd backend && npm run dev — or from project folder: npm install && npm run dev (starts API + frontend).'
      : null) ||
    e.message ||
    fallback

  const openPayQrModal = () => {
    if (!user) return toast.error('Sign in to pay')
    setPayQrModalOpen(true)
  }

  const payWallet = async () => {
    if (!user) return toast.error('Sign in to pay')
    setPayBusy(true)
    try {
      const bookingId = await resolvePendingBookingId()
      if (!bookingId) {
        toast.error('No pending booking. Book the ticket first.')
        return
      }
      await client.post('/payments/wallet-pay', { bookingId })
      toast.success('Paid with wallet')
      setBooking(null)
      await load()
    } catch (e) {
      toast.error(paymentErrorMessage(e, 'Wallet payment failed'))
    } finally {
      setPayBusy(false)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      await client.post('/reviews', {
        eventId: id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      })
      toast.success('Review posted')
      setReviewForm({ rating: 5, comment: '' })
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed')
    }
  }

  if (!data) {
    return <p className="text-slate-500">Loading…</p>
  }

  const img = data.image?.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'
  const seatsLeft = data.totalSeats - data.bookedCount

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
          <img src={img} alt="" className="aspect-video w-full object-cover" />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold uppercase text-indigo-600 dark:text-indigo-400">{data.category}</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{data.title}</h1>
            </div>
            <button
              type="button"
              onClick={toggleBookmark}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
                bookmarked
                  ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
              {bookmarked ? 'Saved' : 'Save'}
            </button>
          </div>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <MapPin className="h-4 w-4" /> {data.location}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            {data.date ? format(new Date(data.date), 'EEEE, MMM d, yyyy') : ''} · {data.startTime} – {data.endTime}
          </p>
          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{data.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {seatsLeft} seats left / {data.totalSeats}
            </span>
            <span className="inline-flex items-center gap-1">
              <Radio className="h-4 w-4" /> ~{data.liveViewers || 0} browsing chat now
            </span>
            <span className="inline-flex items-center gap-1">
              <Ticket className="h-4 w-4" /> {data.checkedInCount || 0} checked in
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-500" /> {avg.average} ({avg.count} reviews)
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.price > 0 ? `₹${data.price}` : 'Free'}
            </p>
            {user &&
              (user.role === 'student' || user.role === 'faculty' || user.role === 'organizer' || user.role === 'admin') && (
              <div className="mt-3 space-y-2">
                {!booking && (
                  <button
                    type="button"
                    onClick={book}
                    disabled={seatsLeft < 1}
                    className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {seatsLeft < 1 ? 'Sold out' : 'Book ticket'}
                  </button>
                )}
                {booking?.status === 'pending' && (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-700 dark:text-amber-300">Payment required to confirm.</p>
                    <button
                      type="button"
                      onClick={openPayQrModal}
                      className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white dark:bg-white dark:text-slate-900"
                    >
                      Pay with Stripe (test)
                    </button>
                    <button
                      type="button"
                      onClick={openPayQrModal}
                      className="w-full rounded-xl bg-[#0d4e8f] py-3 font-semibold text-white hover:bg-[#0a3d6f]"
                    >
                      Pay with Razorpay (test)
                    </button>
                    <button
                      type="button"
                      onClick={payWallet}
                      disabled={payBusy}
                      className="w-full rounded-xl border border-indigo-600 py-3 font-semibold text-indigo-600 disabled:opacity-60"
                    >
                      Pay with wallet
                    </button>
                  </div>
                )}
                {booking?.status === 'confirmed' && booking.qrPayload && (
                  <div className="text-center">
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Your ticket — {booking.ticketCode}
                    </p>
                    <img src={booking.qrPayload} alt="Ticket QR" className="mx-auto max-w-[200px] rounded-lg border" />
                    <Link to="/dashboard" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                      View in dashboard
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Reviews</h2>
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {r.user?.name || 'Student'} · {r.rating}★
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
              </li>
            ))}
            {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
          </ul>
          {user && (
            <form onSubmit={submitReview} className="mt-4 space-y-2 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-600">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Attended? Leave a review</p>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} stars
                  </option>
                ))}
              </select>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                placeholder="What did you like?"
              />
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Submit review
              </button>
            </form>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Attendee chat</h2>
          <EventChat eventId={id} userName={user?.name} token={token} />
        </div>
      </div>

      {payQrModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-qr-title"
          onClick={() => setPayQrModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPayQrModalOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="pay-qr-title" className="pr-10 text-center text-lg font-semibold text-slate-900 dark:text-white">
              Scan to pay (UPI)
            </h2>
            <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
              Pay with Stripe / Razorpay — use your UPI app to scan
            </p>
            <div className="mt-4 flex justify-center">
              <img
                src="/phonepe-qr.png"
                alt="UPI payment QR code"
                className="max-h-[min(70vh,420px)] w-full max-w-[280px] rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
