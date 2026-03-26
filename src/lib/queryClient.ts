/**
 * Cấu hình TanStack React Query cho CapReview.
 * - staleTime: 30_000
 * - retry: 1
 * - onError: hiển thị toast lỗi
 */
import { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MutationCache, QueryCache } from '@tanstack/react-query'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra'
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
})

