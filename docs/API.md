# Smart Campus OS — REST API

Base URL (local): `http://localhost:5000/api`

All JSON bodies use `Content-Type: application/json` unless noted. Protected routes need:

```http
Authorization: Bearer <jwt_token>
```

**Roles:** `student`, `faculty`, `admin` (legacy `organizer` is treated like `faculty` for auth).

---

## Smart Campus modules (`/campus/*`)

High-level map (all under `/api/campus`):

| Area | Examples |
|------|-----------|
| Attendance | `POST /attendance/sessions`, `GET /attendance/sessions/:id/qr`, `POST /attendance/mark`, `GET /attendance/me`, `GET /attendance/sessions/:id/analytics` |
| Resources | `GET /resources`, `POST /resource-bookings`, `POST /library/issue`, `GET /resources/suggest-slots` |
| Student hub | `GET/POST /notes`, `GET/POST /lost-found`, `GET/POST /forum/threads`, `GET /peers` |
| Automation | `POST /complaints`, `GET /complaints/all` (admin), `POST /hostel/assign`, `POST /notices`, `POST /approvals` |
| AI Brain | `GET /ai/brain-feed`, `POST /ai/chat`, `GET /ai/attendance-prediction` |
| Admin | `GET /admin/overview` |
| Map | `GET /map/pins`, `POST /map/pins` (admin) |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` |

See route definitions in `backend/src/routes/campusRoutes.js` for exact verbs and role guards.

---

## Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Body: `name`, `email`, `password`, optional `role` (`student` \| `faculty`; `organizer` maps to faculty), optional `interests[]`, `department`, `studentRoll`, `skills[]`. |
| POST | `/auth/login` | Body: `email`, `password`. Returns `token` + `user`. |
| GET | `/auth/me` | Current user (JWT). |
| PATCH | `/auth/profile` | Body: optional `name`, `interests[]`, `department`, `studentRoll`, `skills[]`, `bio`. |

---

## Events

| Method | Path | Description |
|--------|------|-------------|
| GET | `/events` | List & filter. Query: `search`, `category`, `minPrice`, `maxPrice`, `fromDate`, `toDate`, `sort` (`date` \| `popularity` \| `price_asc` \| `price_desc`). |
| GET | `/events/trending` | Trending events. |
| GET | `/events/upcoming` | Upcoming events. |
| GET | `/events/:id` | Detail + embedded reviews summary. |
| GET | `/events/mine/list` | **Faculty/Admin** — own events. |
| POST | `/events` | **Faculty/Admin** — `multipart/form-data`: fields + optional file field `poster`. |
| PUT | `/events/:id` | **Faculty/Admin** — same as create; must own event (or admin). |
| DELETE | `/events/:id` | **Faculty/Admin** — delete own event. |

**Event body fields (JSON or form fields):** `title`, `description`, `category` (`fest` \| `workshop` \| `seminar` \| `competition` \| `other`), `date` (ISO), `startTime`, `endTime`, `location`, `price`, `totalSeats`, `isPublished`.

---

## Bookings & tickets

| Method | Path | Description |
|--------|------|-------------|
| POST | `/bookings` | Body: `eventId`. Free events confirm immediately. Paid: pending + `needsPayment` when Stripe or Razorpay is configured; if **neither** is set, dev mode auto-confirms (optional `simulatePaid: true`). |
| GET | `/bookings/mine` | Booking history with populated `event`. |
| GET | `/bookings/:id` | Single booking + QR data URL in `qrPayload`. |

---

## Payments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/payments/config` | **Public.** `{ stripe, razorpay, razorpayKeyId }` — which gateways are enabled (Razorpay key id is safe to expose). |
| POST | `/payments/create-checkout-session` | Body: `bookingId`. Stripe Checkout `url` (test/live per key). |
| GET | `/payments/verify-session?session_id=` | After Stripe redirect — confirms booking. |
| POST | `/payments/razorpay/create-order` | Body: `bookingId`. Creates Razorpay order (INR, paise); stores `razorpayOrderId` on booking. Returns `orderId`, `amount`, `currency`, `keyId`. |
| POST | `/payments/razorpay/verify` | Body: `bookingId`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. Verifies HMAC signature and confirms booking. |
| POST | `/payments/wallet-pay` | Body: `bookingId` — pays from user `walletBalance` (demo). |

---

## Organizer

| Method | Path | Description |
|--------|------|-------------|
| GET | `/faculty/dashboard` | Registrations, revenue, check-ins per event. |
| POST | `/faculty/checkin` | Body: `ticketCode` **or** `qrRaw` (JSON from ticket QR, or plain `TKT-…` if the scanner returns only the code). |
| GET | `/faculty/events/:eventId/attendees` | Attendee list + crowd summary. |
| GET | `/organizer/dashboard` | **Deprecated** — same as `/faculty/dashboard`. |
| POST | `/organizer/checkin` | **Deprecated** — same as `/faculty/checkin`. |
| GET | `/organizer/events/:eventId/attendees` | **Deprecated** — same as `/faculty/events/...`. |

---

## Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | All users (no passwords). |
| PATCH | `/admin/users/:id/role` | Body: `role` (`student` \| `faculty` \| `organizer` \| `admin`); `organizer` stored as `faculty`. |
| POST | `/admin/wallet` | Body: `userId`, `amount` — add demo wallet credits. |

---

## Reviews & bookmarks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/reviews` | Body: `eventId`, `rating` (1–5), `comment`. Confirmed attendees only; one review per user/event. |
| GET | `/reviews/event/:eventId` | List reviews. |
| POST | `/bookmarks/toggle` | Body: `eventId`. |
| GET | `/bookmarks` | Saved events. |
| GET | `/bookmarks/status/:eventId` | `{ bookmarked: boolean }`. |

---

## Recommendations & notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recommendations` | Personalized events; uses OpenAI when `OPENAI_API_KEY` is set. |
| GET | `/notifications/in-app` | Upcoming bookings as notification items. |
| POST | `/notifications/remind` | Body: `bookingId` — sends reminder email (or logs if SMTP unset). |

---

## WebSocket (Socket.io)

Connect to the same origin as the API (e.g. `http://localhost:5000`) with path `/socket.io`.

**Auth (optional for viewing history):** `io(url, { auth: { token: jwt } })`

| Event (client → server) | Payload | Description |
|-------------------------|---------|-------------|
| `join_event` | `{ eventId, userName }` | Join chat room; increments `liveViewers` if JWT present. |
| `leave_event` | `{ eventId? }` | Leave room. |
| `chat_message` | `{ eventId, message }` | **Requires JWT.** Broadcasts to room. |

| Event (server → client) | Description |
|-------------------------|-------------|
| `chat_history` | Last 50 messages. |
| `chat_message` | New message. |
| `crowd_update` | `{ eventId, delta }` live viewer change. |

---

## Health

`GET /api/health` → `{ ok: true }`
