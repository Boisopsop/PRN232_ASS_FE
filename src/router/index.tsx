/**
 * Khai báo router chính cho CapReview (React Router v6 createBrowserRouter).
 */
import { Navigate, createBrowserRouter, redirect } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { StudentLayout } from '@/components/layout/StudentLayout'
import { useAuthStore } from '@/stores/authStore'

import { ProtectedRoute } from '@/router/ProtectedRoute'
import { getRoleHomePath } from '@/router/getRoleHomePath'
import { NotFoundPage } from '@/pages/NotFoundPage'

import { LoginPage } from '@/pages/auth/LoginPage'
import { StudentDashboard } from '@/pages/student/StudentDashboard'
import { StudentCalendar } from '@/pages/student/StudentCalendar'
import { ReviewerDashboard } from '@/pages/reviewer/ReviewerDashboard'
import { ReviewerCalendar } from '@/pages/reviewer/ReviewerCalendar'
import { ModeratorDashboard } from '@/pages/moderator/ModeratorDashboard'
import { ManageRounds } from '@/pages/moderator/ManageRounds'
import { ManageSlots } from '@/pages/moderator/ManageSlots'
import { ReviewerConfig } from '@/pages/moderator/ReviewerConfig'
import { NotificationsPage } from '@/pages/moderator/NotificationsPage'

export { getRoleHomePath }

export const router = createBrowserRouter([
  {
    path: '/',
    loader: async () => {
      const { currentUser, isAuthenticated } = useAuthStore.getState()
      if (!isAuthenticated || !currentUser) return redirect('/login')
      return redirect(getRoleHomePath(currentUser.role))
    },
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <StudentLayout />,
    children: [
      {
        path: 'student/dashboard',
        element: (
          <ProtectedRoute roleGroup="student">
            <StudentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'student/calendar',
        element: (
          <ProtectedRoute roleGroup="student">
            <StudentCalendar />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: 'reviewer/dashboard',
        element: (
          <ProtectedRoute roleGroup="reviewer">
            <ReviewerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviewer/calendar',
        element: (
          <ProtectedRoute roleGroup="reviewer">
            <ReviewerCalendar />
          </ProtectedRoute>
        ),
      },
      {
        path: 'moderator/dashboard',
        element: (
          <ProtectedRoute roleGroup="moderator">
            <ModeratorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'moderator/rounds',
        element: (
          <ProtectedRoute roleGroup="moderator">
            <ManageRounds />
          </ProtectedRoute>
        ),
      },
      {
        path: 'moderator/slots',
        element: (
          <ProtectedRoute roleGroup="moderator">
            <ManageSlots />
          </ProtectedRoute>
        ),
      },
      {
        path: 'moderator/config',
        element: (
          <ProtectedRoute roleGroup="moderator">
            <ReviewerConfig />
          </ProtectedRoute>
        ),
      },
      {
        path: 'moderator/notifications',
        element: (
          <ProtectedRoute roleGroup="moderator">
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

