import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './components/layout/MainLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/public/HomePage'
import EventsPage from './pages/public/EventsPage'
import EventDetailPage from './pages/public/EventDetailPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

import StudentDashboardPage from './pages/student/StudentDashboardPage'
import PaymentSuccessPage from './pages/student/PaymentSuccessPage'
import BrainPage from './pages/student/BrainPage'
import AttendanceScanPage from './pages/student/AttendanceScanPage'
import NotesPage from './pages/student/NotesPage'
import LostFoundPage from './pages/student/LostFoundPage'
import ForumPage from './pages/student/ForumPage'
import ForumThreadPage from './pages/student/ForumThreadPage'
import PeersPage from './pages/student/PeersPage'
import ComplaintsPage from './pages/student/ComplaintsPage'
import HostelPage from './pages/student/HostelPage'
import ApprovalsPage from './pages/student/ApprovalsPage'

import FacultyDashboardPage from './pages/faculty/FacultyDashboardPage'
import CreateEventPage from './pages/faculty/CreateEventPage'
import AttendanceManagePage from './pages/faculty/AttendanceManagePage'

import ResourcesPage from './pages/shared/ResourcesPage'
import CampusMapPage from './pages/shared/CampusMapPage'

import AdminPage from './pages/admin/AdminPage'

const anyUser = ['student', 'faculty', 'organizer', 'admin']
const facultyPlus = ['faculty', 'organizer', 'admin']

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/events/new" element={<ProtectedRoute roles={facultyPlus} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<CreateEventPage />} />
          </Route>
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
        </Route>

        <Route path="/dashboard" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<StudentDashboardPage />} />
          </Route>
        </Route>

        <Route path="/brain" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<BrainPage />} />
          </Route>
        </Route>

        <Route path="/attendance/scan" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<AttendanceScanPage />} />
          </Route>
        </Route>

        <Route path="/attendance/manage" element={<ProtectedRoute roles={facultyPlus} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<AttendanceManagePage />} />
          </Route>
        </Route>

        <Route path="/resources" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<ResourcesPage />} />
          </Route>
        </Route>

        <Route path="/map" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<CampusMapPage />} />
          </Route>
        </Route>

        <Route path="/notes" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<NotesPage />} />
          </Route>
        </Route>

        <Route path="/lost-found" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<LostFoundPage />} />
          </Route>
        </Route>

        <Route path="/forum" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<ForumPage />} />
          </Route>
        </Route>

        <Route path="/forum/:id" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<ForumThreadPage />} />
          </Route>
        </Route>

        <Route path="/peers" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<PeersPage />} />
          </Route>
        </Route>

        <Route path="/complaints" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<ComplaintsPage />} />
          </Route>
        </Route>

        <Route path="/hostel" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<HostelPage />} />
          </Route>
        </Route>

        <Route path="/approvals" element={<ProtectedRoute roles={anyUser} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<ApprovalsPage />} />
          </Route>
        </Route>

        <Route path="/faculty" element={<ProtectedRoute roles={facultyPlus} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<FacultyDashboardPage />} />
          </Route>
        </Route>

        <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
