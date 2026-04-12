import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCampusSocket } from '../../hooks/useCampusSocket'
import DashboardNavbar from './DashboardNavbar'
import DashboardSidebar from './DashboardSidebar'

/**
 * FYP-style dashboard shell: fixed navbar + collapsible sidebar + main content.
 */
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  useCampusSocket(user)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardNavbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <DashboardSidebar open={sidebarOpen} setOpen={setSidebarOpen} userRole={user?.role} />
      <main className="pt-16 lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
