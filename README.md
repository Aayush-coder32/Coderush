# Smart Campus OS

**Smart Campus OS – An Intelligent University Operating System** is a production-style full-stack platform that unifies students, faculty, and administration: smart attendance (rolling QR + geofence + device signals), resources (library, labs, room booking), student utilities (notes, lost & found, peers, forum), events with QR tickets, admin automation (complaints, hostel, notices, approvals), and an **AI Campus Brain** (recommendations, attendance risk, lab crowding hints, chatbot).

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 19 (Vite), Tailwind CSS v4, React Router, Axios, Socket.io client, Recharts, react-hot-toast, html5-qrcode (optional) |
| Backend | Node.js, Express, Mongoose, JWT, Cloudinary (optional), Socket.io, QRCode, OpenAI (optional) |
| Database | MongoDB |

## Project layout

```
Coderush/
├── backend/           # Express API (models, controllers, routes, services)
├── frontend/          # Vite + React SPA
├── docker-compose.yml # MongoDB + API + nginx SPA (optional)
├── docs/API.md        # REST + WebSocket reference (events + campus modules)
└── README.md          # This file
```

## Prerequisites

- **Node.js** 18+
- **MongoDB** locally or **MongoDB Atlas**

## Step-by-step setup (local)

### 1. Backend

```powershell
cd backend
copy .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET (required). Optional: OPENAI_API_KEY, CLOUDINARY_* , CLIENT_URL
npm install
npm run dev
```

API and Socket.io: **http://localhost:5000** (`/api/...`).

### 2. Frontend

```powershell
cd frontend
copy .env.example .env
# VITE_SOCKET_URL=http://127.0.0.1:5000  (default in .env.example)
npm install
npm run dev
```

App: **http://localhost:3001** — Vite proxies `/api` to the backend.

### 3. Sample dummy data

```powershell
cd backend
npm run seed
```

| Role | Email | Password |
|------|-------|----------|
| Student | demo.student@campus.edu | demo1234 |
| Faculty | demo.faculty@campus.edu | demo1234 |
| Admin | demo.admin@campus.edu | demo1234 |

**Demo attendance:** seed creates an active **CS301** session centered near **28.6139, 77.209** (≈200 m radius). Use **Faculty → Class attendance** to show the rolling QR; as a student, paste the QR JSON into **Mark attendance** and capture GPS near that point (or adjust faculty session coordinates to your location).

### 4. Optional integrations

- **OpenAI** — `OPENAI_API_KEY` enables richer event blurbs, AI summary on the Brain page, and the campus assistant chat.
- **Cloudinary** — file uploads for notes / lost & found use real storage when configured; otherwise a placeholder image URL is used for images.
- **Stripe / Razorpay** — unchanged from the original event ticketing flow; see `docs/API.md`.

## AI Campus Brain (features)

- **GET `/api/campus/ai/brain-feed`** — events, notes, books, behavior signals + optional narrative.
- **POST `/api/campus/ai/chat`** — student assistant (OpenAI when configured).
- **GET `/api/campus/ai/attendance-prediction`** — per-course attendance rate vs sessions held; warns below 75%; can emit in-app notifications (throttled).
- **GET `/api/campus/resources/suggest-slots`** — heuristic “low crowd” windows from booking history.

Real-time toasts: Socket.io joins room `user:<id>` on connect; `campus_notification` events are emitted when server-side notifications are created.

## Docker (optional)

From the repo root:

```bash
docker compose up --build
```

- **SPA:** http://localhost:8080 (nginx proxies `/api` and `/socket.io` to the API)
- **API:** http://localhost:5000
- **MongoDB:** localhost:27017

Set strong `JWT_SECRET` in `docker-compose.yml` before any real deployment.

## Deployment hints

### Frontend → [Vercel](https://vercel.com)

1. Create a Vercel project from this repo; **root directory** = `frontend`.
2. Set env: `VITE_SOCKET_URL` = your public API origin (e.g. `https://api.yourapp.com`) if Socket.io is on the same host; otherwise the Render URL below.
3. Configure **rewrites** so `/api/*` proxies to your backend (or set `axios` `baseURL` to the API — would require a one-line change in `frontend/src/lib/api.js` for absolute API URL).

### Backend + Mongo → [Render](https://render.com)

1. **MongoDB Atlas** cluster; copy connection string into `MONGODB_URI`.
2. **Web Service**: root `backend`, build `npm install`, start `npm start`.
3. Env: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL), `OPENAI_API_KEY` (optional), `CLOUDINARY_*` (optional).
4. Enable **WebSockets** on Render for Socket.io.

## API documentation

See **[docs/API.md](docs/API.md)** for routes. Campus modules are under **`/api/campus/*`**.

## Scripts

| Command | Where | Purpose |
|---------|--------|---------|
| `npm run dev` | backend | API + WebSocket (nodemon) |
| `npm run seed` | backend | Demo users + campus data |
| `npm run dev` | frontend | Vite |
| `npm run build` | frontend | Production build |

## License

MIT — built for learning and hackathon demos.
