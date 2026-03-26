/**
 * Điểm khởi động ứng dụng CapReview.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from '@/App'
import './style.css'
import './index.css'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

