import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CalendarDays, LayoutDashboard, LogIn, LogOut, Moon, Sun, Users, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

/**
 * Public / marketing shell — top nav + footer (no sidebar).
 * Pattern similar to auth pages outside dashboard in FYP templates.
 */
export default function MainLayout() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-6 w-6" />
            <span>Smart Campus OS</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/events" className={linkClass}>
              Discover
            </NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" className={linkClass}>
                  <span className="inline-flex items-center gap-1">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </span>
                </NavLink>
                {(user.role === 'faculty' || user.role === 'organizer' || user.role === 'admin') && (
                  <NavLink to="/faculty" className={linkClass}>
                    Faculty
                  </NavLink>
                )}
                {user.role === 'admin' && (
                  <NavLink to="/admin" className={linkClass}>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" /> Admin
                    </span>
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-2 py-2 md:hidden dark:border-slate-800">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/events" className={linkClass}>
            Discover
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <p className="inline-flex items-center justify-center gap-1">
          <CalendarDays className="h-4 w-4" /> Smart Campus Solution — Hackathon demo
        </p>
      </footer>
    </div>
  )
}
