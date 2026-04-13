import axios from 'axios'

/**
 * Shared Axios client (FYP-style `lib/`). Proxies `/api` → backend in dev.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

/** So toasts / catch blocks using `error.message` show the API reason, not only "Request failed with status code 500". */
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const body = error.response?.data
    const apiMsg = typeof body?.message === 'string' ? body.message : typeof body?.error === 'string' ? body.error : null
    if (apiMsg) {
      error.message = apiMsg
    }
    return Promise.reject(error)
  }
)

export default client
