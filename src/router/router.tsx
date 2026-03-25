/**
 * Khai báo router (React Router v6) cho CapReview theo pattern createBrowserRouter.
 */
import { createBrowserRouter } from 'react-router-dom'

import { HomePage } from '@/pages/shared/HomePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
])

