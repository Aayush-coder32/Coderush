# Smart Campus Event Hub — Frontend

React (Vite) + Tailwind. API calls go to `/api` (proxied to the backend).

Layout is FYP-style: `components/layout/` (main site + dashboard shell), `pages/public|auth|student|organizer|admin/`, `lib/api.js` for Axios.

## Run

```bash
npm install
npm run dev
```

Open **http://localhost:3001/** (port **3001** — 5173/5174 se alag).

Backend must be running separately on port **5000** (`../backend`, `npm run dev`).
