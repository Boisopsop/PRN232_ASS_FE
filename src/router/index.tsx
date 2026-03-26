/**
 * Khai báo router chính cho CapReview (React Router v6 createBrowserRouter).
 */
import { Navigate, createBrowserRouter, redirect } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { useAuthStore } from '@/stores/authStore'

import { ProtectedRoute } from '@/router/ProtectedRoute'
import { getRoleHomePath } from '@/router/getRoleHomePath'
import { NotFoundPage } from '@/pages/NotFoundPage'

import { LoginPage } from '@/pages/auth/LoginPage'
import { StudentDashboard } from '@/pages/student/StudentDashboard'
import { StudentSlotRegistration } from '@/pages/student/StudentSlotRegistration'
import { MySchedule as StudentMySchedule } from '@/pages/student/MySchedule'
import { ReviewerDashboard } from '@/pages/reviewer/ReviewerDashboard'
import { ReviewerSlotRegistration } from '@/pages/reviewer/ReviewerSlotRegistration'
import { MySchedule as ReviewerMySchedule } from '@/pages/reviewer/MySchedule'
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
    element: <AppLayout />,
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
        path: 'student/register',
        element: (
          <ProtectedRoute roleGroup="student">
            <StudentSlotRegistration />
          </ProtectedRoute>
        ),
      },
      {
        path: 'student/schedule',
        element: (
          <ProtectedRoute roleGroup="student">
            <StudentMySchedule />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviewer/dashboard',
        element: (
          <ProtectedRoute roleGroup="reviewer">
            <ReviewerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviewer/register',
        element: (
          <ProtectedRoute roleGroup="reviewer">
            <ReviewerSlotRegistration />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviewer/schedule',
        element: (
          <ProtectedRoute roleGroup="reviewer">
            <ReviewerMySchedule />
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

