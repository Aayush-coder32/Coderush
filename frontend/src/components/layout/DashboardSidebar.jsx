import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Compass,
  LayoutDashboard,
  CalendarPlus,
  PlusCircle,
  Shield,
  Sparkles,
  ScanLine,
  Map,
  BookOpen,
  Package,
  MessagesSquare,
  Users,
  AlertCircle,
  Building2,
  FileCheck,
} from 'lucide-react'

function navClass(isActive) {
  return `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`
}

export default function DashboardSidebar({ open, setOpen, userRole }) {
  const location = useLocation()

  const core = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Discover events', path: '/events', icon: Compass },
    { name: 'My dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Campus Brain', path: '/brain', icon: Sparkles },
    { name: 'Mark attendance', path: '/attendance/scan', icon: ScanLine },
    { name: 'Campus map', path: '/map', icon: Map },
    { name: 'Resources & library', path: '/resources', icon: Package },
    { name: 'Notes', path: '/notes', icon: BookOpen },
    { name: 'Lost & found', path: '/lost-found', icon: Package },
    { name: 'Forum', path: '/forum', icon: MessagesSquare },
    { name: 'Peers', path: '/peers', icon: Users },
    { name: 'Complaints', path: '/complaints', icon: AlertCircle },
    { name: 'Hostel', path: '/hostel', icon: Building2 },
    { name: 'Approvals', path: '/approvals', icon: FileCheck },
  ]

  const facultyExtra = [
    { name: 'Faculty console', path: '/faculty', icon: CalendarPlus },
    { name: 'Class attendance', path: '/attendance/manage', icon: ScanLine },
    { name: 'New event', path: '/events/new', icon: PlusCircle },
  ]

  const adminExtra = [{ name: 'Admin', path: '/admin', icon: Shield }]

  const isFaculty = userRole === 'faculty' || userRole === 'organizer' || userRole === 'admin'

  let items = [...core]
  if (isFaculty) {
    items = [...items, ...facultyExtra]
  }
  if (userRole === 'admin') {
    items = [...items, ...adminExtra]
  }

  const link = (item) => {
    const Icon = item.icon
    const isActive =
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)

    return (
      <NavLink
        key={`${item.path}-${item.name}`}
        to={item.path}
        className={navClass(isActive)}
        onClick={() => {
          if (window.innerWidth < 1024) setOpen(false)
        }}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="truncate">{item.name}</span>
      </NavLink>
    )
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 -translate-x-full flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${
          open ? 'translate-x-0' : ''
        }`}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">{items.map(link)}</nav>
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">Smart Campus OS</p>
        </div>
      </aside>
    </>
  )
}
