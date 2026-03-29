/**
 * Root App component: khai báo providers toàn cục.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router/index'

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" richColors duration={4000} />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

